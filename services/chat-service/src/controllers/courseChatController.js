const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { getUserInfo } = require('../utils/getUserInfo');
const axios = require('axios');

// ✅ Cache để không phụ thuộc API course-service
const courseCache = new Map();

class CourseChatController {
  
  // Helper: Lấy thông tin khóa học
  async getCourseInfo(courseId, authHeader) {
    try {
      console.log(`📚 Fetching course info for ${courseId}...`);
      
      const response = await axios({
        method: 'get',
        url: `${process.env.COURSE_SERVICE_URL}/api/courses/${courseId}`,
        headers: { Authorization: authHeader },
        timeout: 3000
      });

      const course = response.data.course;
      
      if (course?.title) {
        const courseInfo = {
          title: course.title,
          thumbnail: course.thumbnail || null,
          success: true
        };
        // ✅ Cache result
        courseCache.set(courseId, courseInfo);
        console.log(`✅ Cached: "${course.title}"`);
        return courseInfo;
      }
    } catch (error) {
      console.warn(`⚠️  Could not fetch course: ${error.message}`);
    }

    // ✅ Fallback: return default
    return {
      title: `Course ${courseId}`,
      thumbnail: null,
      success: false
    };
  }

  // ========================
  // 🎓 Tạo/lấy conversation cho khóa học
  // ========================
  async createCourseConversation(req, res) {
    try {
      const { courseId } = req.params;
      const { courseTitle } = req.body; // ✅ Nhận từ frontend
      const userId = req.user.userId || req.user.id;
      const userRole = req.user.role;

      console.log('🎯 Creating course conversation:', { courseId, userId, userRole, courseTitle });

      if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required' });
      }

      // ✅ Tìm conversation đã tồn tại
      let conversation = await Conversation.findOne({
        type: 'course_group',
        courseId: courseId
      }).populate('lastMessage');

      if (!conversation) {
        // ✅ Lấy tên course
        let finalCourseTitle = courseTitle; // Ưu tiên frontend
        
        if (!finalCourseTitle) {
          // ✅ Nếu frontend không gửi, thử lấy từ cache hoặc API
          if (courseCache.has(courseId)) {
            finalCourseTitle = courseCache.get(courseId).title;
            console.log(`📌 Using cached title: "${finalCourseTitle}"`);
          } else {
            const courseInfo = await this.getCourseInfo(courseId, req.headers.authorization);
            finalCourseTitle = courseInfo.title;
            console.log(`📌 Using fetched title: "${finalCourseTitle}"`);
          }
        } else {
          console.log(`📌 Using frontend title: "${finalCourseTitle}"`);
          // ✅ Cache lại để lần sau dùng
          courseCache.set(courseId, { title: courseTitle });
        }

        // ✅ Tạo conversation với tên thực tế
        conversation = new Conversation({
          type: 'course_group',
          courseId: courseId,
          title: `${finalCourseTitle} - Discussion`,
          description: 'Group discussion for course participants and instructors',
          courseInfo: {
            title: finalCourseTitle,
            thumbnail: null
          },
          participants: [{ 
            userId: userId, 
            role: userRole,
            joinedAt: new Date()
          }],
          settings: {
            allowStudentMessages: true,
            autoCreateOnEnrollment: true,
            onlyInstructorsCanPost: false
          }
        });

        await conversation.save();
        console.log(`✅ Created conversation: "${finalCourseTitle} - Discussion"`);
      } else {
        // ✅ Conversation đã tồn tại
        console.log(`📌 Existing conversation: "${conversation.title}"`);
        
        if (!conversation.isParticipant(userId)) {
          conversation.participants.push({
            userId: userId,
            role: userRole,
            joinedAt: new Date()
          });
          await conversation.save();
          console.log(`✅ Added user ${userId} to conversation`);
        }
      }

      // ✅ Lấy thông tin participants
      const populatedParticipants = await Promise.all(
        conversation.participants.map(async (p) => {
          try {
            const userData = await getUserInfo(p.userId);
            return { ...p.toObject(), user: userData };
          } catch (error) {
            console.error('Error getting user info:', error.message);
            return { 
              ...p.toObject(), 
              user: {
                _id: p.userId,
                fullName: 'Unknown User',
                email: 'unknown@example.com',
                role: p.role,
                profile: { avatar: null, bio: null }
              }
            };
          }
        })
      );

      // ✅ Emit realtime event
      const io = req.app.get('io');
      if (io) {
        io.to(conversation._id.toString()).emit('conversation_created', {
          conversationId: conversation._id,
          type: conversation.type,
          title: conversation.title,
          participants: populatedParticipants
        });
      }

      res.json({ 
        message: 'Course conversation ready',
        conversation: {
          ...conversation.toObject(),
          participants: populatedParticipants
        }
      });

    } catch (error) {
      console.error('❌ Create course conversation error:', error.message);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ========================
  // 👨‍🏫 Lấy danh sách instructors của khóa học
  // ========================
// ========================
  // 👨‍🏫 Lấy danh sách instructors của khóa học
  // ========================
  async getCourseInstructors(req, res) {
    console.log('🎯 [DEBUG] getCourseInstructors - axios is defined:', typeof axios !== 'undefined');
    console.log('🎯 [DEBUG] getCourseInstructors - axios version:', axios?.VERSION);
    
    try {
      const { courseId } = req.params;
      
      console.log('🎯 [ChatService] Getting instructors for course:', courseId);
      console.log('🔑 [ChatService] Auth header present:', !!req.headers.authorization);

      if (!courseId) {
        console.error('❌ [ChatService] Missing courseId');
        return res.status(400).json({ error: 'Course ID is required' });
      }

      let courseTitle = 'Course';
      
      // ✅ 1. LẤY COURSE TITLE (cache hoặc API)
      try {
        if (courseCache.has(courseId)) {
          courseTitle = courseCache.get(courseId).title;
          console.log(`📌 [ChatService] Using cached title: "${courseTitle}"`);
        } else {
          const courseInfo = await this.getCourseInfo(courseId, req.headers.authorization);
          courseTitle = courseInfo.title;
          console.log(`📌 [ChatService] Fetched title: "${courseTitle}"`);
        }
      } catch (titleError) {
        console.warn('⚠️ [ChatService] Could not get course title:', titleError.message);
      }

      let courseData;
      
      // ✅ 2. GỌI COURSE-SERVICE VÀ XỬ LÝ LỖI CHI TIẾT
      try {
        console.log(`📞 [ChatService] Calling course-service: ${process.env.COURSE_SERVICE_URL}/api/courses/${courseId}`);
        
        const courseResponse = await axios({
          method: 'get',
          url: `${process.env.COURSE_SERVICE_URL}/api/courses/${courseId}`,
          headers: { 
            Authorization: req.headers.authorization,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });

        console.log('📦 [ChatService] Course-service response status:', courseResponse.status);
        
        // ✅ XỬ LÝ LINH HOẠT CÁC CẤU TRÚC RESPONSE
        courseData = courseResponse.data;
        
        console.log('🔍 [ChatService] Full course response:', JSON.stringify({
          status: courseResponse.status,
          data: courseData
        }, null, 2));

      } catch (apiError) {
        console.error('❌ [ChatService] Course-service API error:', {
          message: apiError.message,
          status: apiError.response?.status,
          data: apiError.response?.data,
          url: apiError.config?.url
        });

        if (apiError.response?.status === 404) {
          return res.status(404).json({ 
            error: 'Course not found in course-service',
            courseId 
          });
        }
        
        if (apiError.response?.status === 401) {
          return res.status(401).json({ 
            error: 'Unauthorized to access course information' 
          });
        }

        return res.status(500).json({ 
          error: 'Failed to fetch course data from course-service',
          details: apiError.message 
        });
      }

      // ✅ 3. XỬ LÝ LINH HOẠT DỮ LIỆU INSTRUCTORS - CHỈ LẤY INSTRUCTOR CHÍNH
      console.log('🎯 [ChatService] Extracting instructor data...');
      console.log('📦 [ChatService] courseData.instructor:', courseData?.instructor);
      
      let instructorId = null;

      // ✅ PRIORITY 1: courseData.instructor
      if (courseData?.instructor) {
        instructorId = courseData.instructor;
        console.log('📘 [ChatService] Found main instructor in courseData.instructor');
      }
      // ✅ PRIORITY 2: courseData.data.instructor
      else if (courseData?.data?.instructor) {
        instructorId = courseData.data.instructor;
        console.log('📘 [ChatService] Found in courseData.data.instructor');
      }
      // ✅ PRIORITY 3: courseData.course.instructor
      else if (courseData?.course?.instructor) {
        instructorId = courseData.course.instructor;
        console.log('📘 [ChatService] Found in courseData.course.instructor');
      }
      else {
        console.warn('⚠️ [ChatService] No instructor found in response');
        console.log('📦 [ChatService] Available keys:', Object.keys(courseData || {}));
        return res.json({ 
          instructors: [], 
          courseTitle,
          debug: {
            courseId,
            message: 'No instructor found in course data'
          }
        });
      }

      console.log('✅ [ChatService] Found instructor ID:', instructorId);

      // ✅ 4. CHUẨN HÓA INSTRUCTOR ID
      let finalInstructorId = null;
      
      if (typeof instructorId === 'string') {
        finalInstructorId = instructorId;
      } else if (typeof instructorId === 'object' && instructorId?._id) {
        finalInstructorId = instructorId._id.toString();
      } else if (typeof instructorId === 'object' && instructorId?.id) {
        finalInstructorId = instructorId.id.toString();
      }

      if (!finalInstructorId) {
        console.warn('⚠️ [ChatService] Could not extract instructor ID from:', instructorId);
        return res.json({ 
          instructors: [], 
          courseTitle,
          debug: {
            courseId,
            message: 'Invalid instructor ID format'
          }
        });
      }

      console.log('✅ [ChatService] Extracted instructor ID:', finalInstructorId);

      // ✅ 5. LẤY THÔNG TIN CHI TIẾT CỦA INSTRUCTOR
      console.log('🔍 [ChatService] Fetching detailed instructor info...');
      
      try {
        console.log(`👤 [ChatService] Fetching user info for: ${finalInstructorId}`);
        const userInfo = await getUserInfo(finalInstructorId);
        
        if (!userInfo) {
          console.warn(`⚠️ [ChatService] getUserInfo returned null for: ${finalInstructorId}`);
          return res.json({ 
            instructors: [{
              _id: finalInstructorId,
              fullName: 'Unknown Instructor',
              email: 'unknown@example.com',
              role: 'instructor',
              profile: { avatar: null, bio: null }
            }],
            courseTitle
          });
        }
        
        const instructorInfo = {
          _id: userInfo._id || finalInstructorId,
          fullName: userInfo.fullName || 'Unknown Instructor',
          email: userInfo.email || 'unknown@example.com',
          role: userInfo.role || 'instructor',
          profile: {
            avatar: userInfo.avatar || userInfo.profile?.avatar || null,
            bio: userInfo.bio || userInfo.profile?.bio || null
          }
        };

        console.log('🎉 [ChatService] Final instructor result:', {
          id: instructorInfo._id,
          name: instructorInfo.fullName
        });

        // ✅ 6. EMIT REALTIME EVENT (nếu cần)
        try {
          const io = req.app.get('io');
          if (io) {
            io.to(courseId).emit('instructor_fetched', {
              courseId,
              courseTitle,
              instructor: instructorInfo,
              timestamp: new Date().toISOString()
            });
            console.log('📢 [ChatService] Emitted instructor_fetched event');
          }
        } catch (emitError) {
          console.warn('⚠️ [ChatService] Could not emit socket event:', emitError.message);
        }

        // ✅ 7. TRẢ VỀ KẾT QUẢ
        res.json({ 
          instructors: [instructorInfo],  // Trả về mảng với 1 phần tử
          courseTitle,
          debug: process.env.NODE_ENV === 'development' ? {
            courseId,
            instructorId: finalInstructorId
          } : undefined
        });

      } catch (userError) {
        console.error(`❌ [ChatService] Error fetching instructor ${finalInstructorId}:`, userError.message);
        return res.json({
          instructors: [{
            _id: finalInstructorId,
            fullName: 'Unknown Instructor',
            email: 'unknown@example.com',
            role: 'instructor',
            profile: { avatar: null, bio: null }
          }],
          courseTitle
        });
      }

    } catch (error) {
      console.error('💥 [ChatService] CRITICAL ERROR in getCourseInstructors:', {
        message: error.message,
        stack: error.stack,
        courseId: req.params.courseId,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({ 
        error: 'Internal server error while fetching instructors',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  // ========================
  // 📚 Lấy tất cả conversations của một khóa học
  // ========================
  async getCourseConversations(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.userId || req.user.id;

      if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required' });
      }

      const conversations = await Conversation.find({
        courseId: courseId,
        'participants.userId': userId
      })
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conversation) => {
          const unreadCount = await Message.countDocuments({
            conversationId: conversation._id,
            'readBy.userId': { $ne: userId },
            senderId: { $ne: userId }
          });

          const participantsWithInfo = await Promise.all(
            conversation.participants.map(async (p) => {
              try {
                const userData = await getUserInfo(p.userId);
                return { ...p.toObject(), user: userData };
              } catch (error) {
                console.error('Error getting user info:', error.message);
                return { 
                  ...p.toObject(), 
                  user: {
                    _id: p.userId,
                    fullName: 'Unknown User',
                    email: 'unknown@example.com',
                    role: p.role,
                    profile: { avatar: null, bio: null }
                  }
                };
              }
            })
          );

          return {
            ...conversation.toObject(),
            participants: participantsWithInfo,
            unreadCount
          };
        })
      );

      // ✅ Emit realtime event
      const io = req.app.get('io');
      if (io) {
        io.to(courseId).emit('conversations_updated', {
          courseId,
          conversations: conversationsWithDetails,
          total: conversations.length
        });
      }

      res.json({
        courseId,
        conversations: conversationsWithDetails,
        total: conversations.length
      });

    } catch (error) {
      console.error('❌ Get course conversations error:', error.message);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ========================
  // 💬 Tạo conversation với instructor
  // ========================
  async createInstructorConversation(req, res) {
    try {
      const { courseId, instructorId } = req.params;
      const userId = req.user.userId || req.user.id;
      const userRole = req.user.role;

      if (!courseId || !instructorId) {
        return res.status(400).json({ error: 'Course ID and Instructor ID are required' });
      }

      console.log('💬 Creating instructor conversation:', { courseId, instructorId, userId });

      let conversation = await Conversation.findDirectConversation(userId, instructorId);

      if (!conversation) {
        let instructorInfo;
        try {
          instructorInfo = await getUserInfo(instructorId);
        } catch (error) {
          console.warn(`Could not fetch instructor info: ${error.message}`);
          instructorInfo = {
            fullName: 'Instructor',
            _id: instructorId
          };
        }
        
        conversation = new Conversation({
          type: 'direct',
          courseId: courseId,
          title: `Chat with ${instructorInfo.fullName}`,
          participants: [
            { userId: userId, role: userRole },
            { userId: instructorId, role: 'instructor' }
          ]
        });

        await conversation.save();
        console.log(`✅ Created instructor conversation`);
      }

      const populatedParticipants = await Promise.all(
        conversation.participants.map(async (p) => {
          try {
            const userData = await getUserInfo(p.userId);
            return { ...p.toObject(), user: userData };
          } catch (error) {
            console.error('Error getting user info:', error.message);
            return { 
              ...p.toObject(), 
              user: {
                _id: p.userId,
                fullName: p.role === 'instructor' ? 'Instructor' : 'User',
                email: 'unknown@example.com',
                role: p.role,
                profile: { avatar: null, bio: null }
              }
            };
          }
        })
      );

      // ✅ Emit realtime event
      const io = req.app.get('io');
      if (io) {
        io.to(conversation._id.toString()).emit('instructor_conversation_created', {
          conversationId: conversation._id,
          type: conversation.type,
          title: conversation.title,
          courseId,
          instructorId,
          participants: populatedParticipants
        });
      }

      res.status(201).json({
        message: 'Instructor conversation ready',
        conversation: {
          ...conversation.toObject(),
          participants: populatedParticipants
        }
      });

    } catch (error) {
      console.error('❌ Create instructor conversation error:', error.message);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new CourseChatController();