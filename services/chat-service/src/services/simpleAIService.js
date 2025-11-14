// services/chat-service/src/services/simpleAIService.js
const axios = require('axios');
const redis = require('redis');

const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect().catch(console.error);

class SimpleAIService {
  constructor() {
    // Gemini setup
    this.geminiApiKey = process.env.GEMINI_API_KEY || null;
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  /**
   * 📚 Lấy toàn bộ courses từ course-service
   * Cache Redis 6 tiếng
   */
  async getCourseDatabase() {
    try {
      const cached = await client.get('courses:db');
      if (cached) {
        console.log('✅ Using cached courses');
        return JSON.parse(cached);
      }

      const response = await axios.get(
        `${process.env.COURSE_SERVICE_URL || 'http://course-service:3002'}/?limit=1000`,
        { timeout: 5000 }
      );

      console.log('🟢 Raw response keys:', Object.keys(response.data));
      console.log('🟢 Sample course:', response.data.courses?.[0]);

      const courses = response.data.courses || response.data || [];

      const courseDb = courses.map(c => ({
        id: c._id,
        title: c.title,
        description: c.description || c.shortDescription || '',
        category: c.category || 'general',
        level: c.level || 'beginner',
        price: c.fullCoursePrice || c.lessonPrice || 0,
        duration: c.duration || 0,
      }));

      // cache 6h
      await client.setEx('courses:db', 21600, JSON.stringify(courseDb));
      console.log(`✅ Cached ${courseDb.length} courses`);

      return courseDb;
    } catch (error) {
      console.error('❌ Get courses error:', error.message);
      return [];
    }
  }

  /**
   * 🔍 Search thô theo từ khóa (có bỏ dấu tiếng Việt)
   */
  async searchCourses(query, topK = 5) {
    const courseDb = await this.getCourseDatabase();
    if (!courseDb || courseDb.length === 0) {
      console.log('⚠️ No courses found in DB');
      return [];
    }

    // chuẩn hóa string để so sánh dễ hơn
    const normalize = (str) =>
      str
        ?.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // bỏ dấu
        .toLowerCase() || '';

    const q = normalize(query);
    const words = q.split(/\s+/).filter(Boolean);

    const scored = courseDb.map(course => {
      let score = 0;

      const textNorm = normalize(
        `${course.title} ${course.description} ${course.category} ${course.level}`
      );

      // +5 nếu từng từ xuất hiện
      for (const w of words) {
        if (textNorm.includes(w)) score += 5;
      }

      // +10 nếu nguyên cụm query nằm trong title
      if (normalize(course.title).includes(q)) score += 10;

      if (score > 0) {
        console.log(`✅ MATCH: ${course.title} (${score})`);
      }

      return { ...course, score };
    });

    const results = scored
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    console.log(`📚 Found ${results.length} relevant courses`);
    return results;
  }

  /**
   * 🤖 Gọi Gemini sinh gợi ý khóa học bằng tiếng Anh đơn giản
   * Trả string. Nếu lỗi → return null (không throw nữa).
   */
  async callGemini(prompt) {
    if (!this.geminiApiKey) {
      console.warn('⚠️ No GEMINI_API_KEY configured, skipping Gemini call.');
      return null;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.geminiApiKey}`;

      const body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      };

      const response = await axios.post(url, body, { timeout: 30000 });

      // theo spec Gemini `generateContent`
      // response.data.candidates[0].content.parts[0].text
      const text =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        null;

      return text; // có thể là null nếu model im lặng
    } catch (error) {
      console.error('❌ Gemini error:', error.response?.data || error.message);
      return null; // QUAN TRỌNG: không throw
    }
  }

  /**
   * 💬 Pipeline chính khi user gửi message
   */
  async processUserMessage(userMessage, userId) {
    console.log(`🎯 Processing: "${userMessage}"`);

    // 1. Tìm khóa học liên quan
    const relevantCourses = await this.searchCourses(userMessage, 5);
    console.log(`📚 Found ${relevantCourses.length} relevant courses`);

    if (relevantCourses.length === 0) {
      return {
        reply:
          'Sorry, I could not find any matching courses. Please try different keywords like: "Python", "Web Development", "Design"...',
        courses: [],
      };
    }

    // 2. Build list khóa học dạng text
    const coursesText = relevantCourses
      .map(
        (c, i) =>
          `${i + 1}. ${c.title} (${c.category}, ${c.level}) - $${c.price}`
      )
      .join('\n');

    // 3. Prompt cho Gemini
    const systemPrompt = `You are a helpful educational assistant helping students choose the best course from our catalog.

Available Courses:
${coursesText}

Your job:
1. Understand what the student wants to learn
2. Recommend 1-2 of the most relevant courses from the list above
3. Explain briefly why they are a good fit
4. Sound friendly and supportive

RULES:
- ONLY recommend courses from the list above
- ALWAYS mention the exact course title
- Keep your answer in simple English, 2-3 sentences max
- Do not invent new courses`;

    const fullPrompt = `${systemPrompt}

Student: ${userMessage}

Assistant:`;

    // 4. Gọi Gemini
    const aiReplyRaw = await this.callGemini(fullPrompt);

    // 5. Fallback nếu Gemini fail hoặc trả rỗng
    const fallbackReply =
      `Here are some courses that match what you want:\n` +
      relevantCourses
        .map(
          (c, i) =>
            `${i + 1}. ${c.title} (${c.category}, ${c.level}) - $${c.price}`
        )
        .join('\n');

    const finalReply =
      aiReplyRaw && aiReplyRaw.trim().length > 0
        ? aiReplyRaw.trim()
        : fallbackReply;

    // 6. Response trả về FE
    return {
      reply: finalReply,
      courses: relevantCourses.map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
      })),
    };
  }

  /**
   * 🧹 Xoá cache nếu cần
   */
  async clearCache() {
    await client.del('courses:db');
    console.log('✅ Courses cache cleared');
  }
}

module.exports = new SimpleAIService();
