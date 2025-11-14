const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const simpleAIService = require('../services/simpleAIService');

class SimpleAIChatController {
  /**
   * 🤖 Chat with AI
   */
  async chatWithAI(req, res) {
    try {
      const { content, conversationId } = req.body;
      const userId = req.user.userId || req.user.id;

      if (!content?.trim()) {
        return res.status(400).json({ error: 'Message required' });
      }

      console.log(`💬 New message from ${userId}`);

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Lưu user message
      const userMsg = new Message({
        conversationId,
        senderId: userId,
        content: content.trim(),
        type: 'text'
      });
      await userMsg.save();

      // Process AI response
      const aiResponse = await simpleAIService.processUserMessage(content, userId);

      // Lưu AI message
      const aiMsgContent = `${aiResponse.reply}\n\n📚 **Gợi ý khóa học:**\n${aiResponse.courses.map(c => `• ${c.title} (${c.category})`).join('\n')}`;

      const aiMsg = new Message({
        conversationId,
        senderId: 'ai-assistant',
        content: aiMsgContent,
        type: 'text'
      });
      await aiMsg.save();

      // Update conversation
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: aiMsg._id,
        updatedAt: new Date()
      });

      // Emit realtime socket
      const io = req.app.get('io');
      if (io) {
        io.to(conversationId).emit('new_message', {
          _id: aiMsg._id,
          conversationId,
          senderId: {
            _id: 'ai-assistant',
            fullName: '🤖 AI Assistant',
            profile: { avatar: null }
          },
          content: aiMsgContent,
          createdAt: aiMsg.createdAt,
          isAI: true
        });
      }

      res.json({
        success: true,
        aiMessage: {
          id: aiMsg._id,
          content: aiMsgContent,
          courses: aiResponse.courses
        }
      });

    } catch (error) {
      console.error('❌ Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 🎯 Quick search
   */
  async quickRecommend(req, res) {
    try {
      const { keyword } = req.query;

      if (!keyword) {
        return res.status(400).json({ error: 'Keyword required' });
      }

      const courses = await simpleAIService.searchCourses(keyword, 3);

      res.json({
        keyword,
        courses: courses.map(c => ({
          id: c.id,
          title: c.title,
          category: c.category,
          level: c.level,
          price: c.price
        }))
      });

    } catch (error) {
      console.error('❌ Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 🔄 Refresh cache
   */
  async refreshCourseCache(req, res) {
    try {
      await simpleAIService.clearCache();
      const courses = await simpleAIService.getCourseDatabase();

      res.json({
        success: true,
        totalCourses: courses.length
      });

    } catch (error) {
      console.error('❌ Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 🧠 Init AI conversation (public)
   */
  async initConversation(req, res) {
    try {
      const conversationId = new Date().getTime().toString(); // fake ID
      res.status(200).json({
        conversationId,
        message: 'AI conversation initialized successfully'
      });
    } catch (error) {
      console.error('initConversation error:', error);
      res.status(500).json({ error: 'Failed to initialize conversation' });
    }
  }
}

module.exports = new SimpleAIChatController();
