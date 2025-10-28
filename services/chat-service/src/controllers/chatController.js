const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { getUserInfo } = require('../utils/getUserInfo');

class ChatController {

  // ========================
  // 📨 Get user's conversations
  // ========================
  async getConversations(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const conversations = await Conversation.find({
        'participants.userId': userId
      })
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get unread counts + fetch participant info
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conversation) => {
          const unreadCount = await Message.countDocuments({
            conversationId: conversation._id,
            'readBy.userId': { $ne: userId },
            senderId: { $ne: userId }
          });

          // Gọi user-service lấy thông tin từng participant
          const participantsWithInfo = await Promise.all(
            conversation.participants.map(async (p) => {
              const userData = await getUserInfo(p.userId);
              return { ...p.toObject(), user: userData };
            })
          );

          return {
            ...conversation.toObject(),
            participants: participantsWithInfo,
            unreadCount
          };
        })
      );

      res.json({
        conversations: conversationsWithDetails,
        page: parseInt(page),
        limit: parseInt(limit)
      });

    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========================
  // 💬 Create new conversation
  // ========================
  async createConversation(req, res) {
    try {
      const { type, participantIds, courseId, title, description } = req.body;
      const userId = req.user.userId || req.user.id;
      const userRole = req.user.role;

      if (!userId) {
        return res.status(401).json({ error: 'Invalid user in token' });
      }

      let conversation;

      // Check if direct conversation already exists
      if (type === 'direct' && participantIds && participantIds.length === 1) {
        conversation = await Conversation.findDirectConversation(userId, participantIds[0]);
        if (conversation) {
          return res.json({
            message: 'Direct conversation already exists',
            conversation
          });
        }
      }

      // Build participants array
      const participants = [
        { userId: userId, role: userRole },
        ...(participantIds || []).map(id => ({
          userId: id,
          role: 'student'
        }))
      ];

      // Create conversation
      conversation = new Conversation({
        type,
        participants,
        courseId,
        title,
        description
      });

      await conversation.save();

      // Fetch user info for each participant
      const populatedParticipants = await Promise.all(
        conversation.participants.map(async (p) => {
          const userData = await getUserInfo(p.userId);
          return { ...p.toObject(), user: userData };
        })
      );

      res.status(201).json({
        message: 'Conversation created successfully',
        conversation: {
          ...conversation.toObject(),
          participants: populatedParticipants
        }
      });

    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========================
  // 💭 Get messages in a conversation
  // ========================
  async getMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.userId || req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isParticipant(userId)) {
      return res.status(403).json({ error: 'Access denied to conversation' });
    }

    const messages = await Message.findByConversation(
      conversationId,
      parseInt(page),
      parseInt(limit)
    );

    // ✅ Gắn thêm thông tin người gửi từ user-service
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const senderData = await getUserInfo(msg.senderId);
        return {
          ...msg.toObject(),
          senderId: senderData,
        };
      })
    );

    res.json({
      messages: enrichedMessages.reverse(),
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: messages.length === parseInt(limit),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


  // ========================
  // ✉️ Send a message
  // ========================
  async sendMessage(req, res) {
  try {
    const { conversationId, content } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isParticipant(userId)) {
      return res.status(403).json({ error: 'Not a participant of this conversation' });
    }

    // ✅ Tạo message mới
    const message = new Message({
      conversationId,
      senderId: userId,
      content: content.trim(),
      type: 'text',
    });

    await message.save();

    // ✅ Lấy thông tin người gửi từ user-service
    const senderInfo = await getUserInfo(userId);

    const enrichedMessage = {
      ...message.toObject(),
      senderId: senderInfo,
    };

    // ✅ Cập nhật hội thoại
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // ✅ Emit realtime
    req.app.get('io').to(conversationId).emit('new_message', enrichedMessage);

    res.status(201).json({
      message: 'Message sent successfully',
      data: enrichedMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
// ========================
  // 🎓 GET COURSE INSTRUCTORS
  // ========================
  // ========================
// 🎓 GET COURSE INSTRUCTORS (FIXED)
// ========================
async getCourseInstructors(req, res) {
  try {
    const { courseId } = req.params;
    console.log('🔍 Getting instructors for course:', courseId);

    let course;

    // ✅ BƯỚC 1: Lấy thông tin khóa học từ Course Service
    try {
      const courseResponse = await axios.get(
        `${process.env.COURSE_SERVICE_URL || 'http://localhost:3002'}/api/courses/${courseId}`,
        {
          headers: {
            // Chuyển tiếp Authorization header nếu có
            'Authorization': req.headers.authorization || ''
          }
        }
      );

      // (Giả sử dữ liệu trả về có thể nằm trong 'data.data' hoặc 'data')
      course = courseResponse.data?.data || courseResponse.data;

      if (!course) {
        console.log('⚠️ Course not found from course-service');
        return res.json({ instructors: [] });
      }
       console.log('✅ Course found:', course.title);

    } catch (courseError) {
      console.error('❌ Failed to fetch course info from course-service:', courseError.message);
      // Nếu service kia lỗi (404, 500) thì cũng trả về rỗng
      return res.json({ instructors: [] });
    }

    // ✅ BƯỚC 2: Xử lý thông tin giảng viên (LOGIC ĐÃ SỬA)
    let instructorData = course.instructors || course.instructor; // <-- Lấy 'instructors' (số nhiều) trước, rồi mới tới 'instructor' (số ít)
    let instructors = [];

    if (instructorData) {
      // TH 1: Dữ liệu là một mảng (popuplated hoặc mảng ID)
      if (Array.isArray(instructorData)) {
        
        // Kiểm tra xem mảng chứa Object hay String (ID)
        if (instructorData.length > 0 && typeof instructorData[0] === 'object') {
          // Mảng đã được populate từ course-service
          instructors = instructorData;
        } else {
          // Mảng chỉ chứa ID, cần gọi user-service cho từng ID
          instructors = await Promise.all(
            instructorData.map(id => this.getUserInfo(id))
          );
        }

      } 
      // TH 2: Dữ liệu là một Object (đã populate)
      else if (typeof instructorData === 'object') {
        instructors = [instructorData];
      }
      // TH 3: Dữ liệu là một String (chỉ có 1 ID)
      else if (typeof instructorData === 'string') {
        const info = await this.getUserInfo(instructorData);
        instructors = [info];
      }
    }
    
    // Lọc bỏ các kết quả null (nếu getUserInfo lỗi)
    const validInstructors = instructors.filter(Boolean);

    console.log('✅ Instructors processed:', validInstructors.length, 'found');

    // ✅ BƯỚC 3: Định dạng và trả về
    res.json({
      instructors: validInstructors.map(inst => ({
        _id: inst._id || inst.id, // Đảm bảo lấy đúng _id
        fullName: inst.fullName || inst.name || 'Unknown',
        email: inst.email,
        profile: { // Gửi về profile nếu có (frontend đang dùng)
            avatar: inst.avatar || inst.profile?.avatar
        }
      }))
    });

  } catch (error) {
    console.error('❌ Get course instructors error:', error);
    res.json({ instructors: [] });
  }
}
  // ========================
  // 📋 CREATE COURSE CONVERSATION
  // ========================
  async createCourseConversation(req, res) {
    try {
      const { courseId, courseTitle } = req.body;
      const userId = req.user.userId || req.user.id;
      const userRole = req.user.role;

      console.log('🎯 Creating course conversation:', {
        courseId,
        userId,
        userRole,
        courseTitle
      });

      if (!courseId) {
        return res.status(400).json({ error: 'courseId is required' });
      }

      // ✅ Kiểm tra conversation đã tồn tại chưa
      let conversation = await Conversation.findOne({
        courseId,
        type: 'group'
      });

      if (conversation) {
        console.log('📌 Existing conversation:', conversation.title);
        
        // Add user to participants nếu chưa có
        const isParticipant = conversation.participants.some(p => p.userId === userId);
        if (!isParticipant) {
          conversation.participants.push({
            userId,
            role: userRole
          });
          await conversation.save();
        }

        // Populate thông tin participants
        const participantsWithInfo = await Promise.all(
          conversation.participants.map(async (p) => {
            const userData = await this.getUserInfo(p.userId);
            return { ...p.toObject(), user: userData };
          })
        );

        return res.json({
          message: 'Course conversation already exists',
          conversation: {
            ...conversation.toObject(),
            participants: participantsWithInfo
          }
        });
      }

      // ✅ Tạo conversation mới
      const title = courseTitle ? `${courseTitle} - Discussion` : 'Course Discussion';
      
      conversation = new Conversation({
        type: 'group',
        courseId,
        title,
        description: `Discussion group for ${courseTitle || 'course'}`,
        participants: [
          { userId, role: userRole }
        ]
      });

      await conversation.save();

      console.log('✅ Created conversation:', title);

      // Populate thông tin participants
      const participantsWithInfo = await Promise.all(
        conversation.participants.map(async (p) => {
          const userData = await this.getUserInfo(p.userId);
          return { ...p.toObject(), user: userData };
        })
      );

      res.status(201).json({
        message: 'Course conversation created successfully',
        conversation: {
          ...conversation.toObject(),
          participants: participantsWithInfo
        }
      });

    } catch (error) {
      console.error('❌ Create course conversation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========================
  // 🤝 CREATE INSTRUCTOR CONVERSATION (1-1)
  // ========================
  async createInstructorConversation(req, res) {
    try {
      const { courseId, instructorId } = req.body;
      const userId = req.user.userId || req.user.id;

      console.log('💬 Creating 1-1 instructor conversation:', {
        courseId,
        instructorId,
        userId
      });

      // ✅ Kiểm tra direct conversation đã tồn tại chưa
      let conversation = await Conversation.findOne({
        type: 'direct',
        participants: {
          $all: [
            { $elemMatch: { userId: userId } },
            { $elemMatch: { userId: instructorId } }
          ]
        }
      });

      if (conversation) {
        console.log('📌 1-1 conversation already exists:', conversation._id);
        
        // Populate thông tin
        const participantsWithInfo = await Promise.all(
          conversation.participants.map(async (p) => {
            const userData = await this.getUserInfo(p.userId);
            return { ...p.toObject(), user: userData };
          })
        );

        return res.json({
          message: '1-1 conversation already exists',
          conversation: {
            ...conversation.toObject(),
            participants: participantsWithInfo
          }
        });
      }

      // ✅ Tạo direct conversation mới
      conversation = new Conversation({
        type: 'direct',
        courseId,
        participants: [
          { userId, role: req.user.role },
          { userId: instructorId, role: 'instructor' }
        ]
      });

      await conversation.save();

      console.log('✅ Created 1-1 conversation:', conversation._id);

      // Populate thông tin
      const participantsWithInfo = await Promise.all(
        conversation.participants.map(async (p) => {
          const userData = await this.getUserInfo(p.userId);
          return { ...p.toObject(), user: userData };
        })
      );

      res.status(201).json({
        message: '1-1 conversation created successfully',
        conversation: {
          ...conversation.toObject(),
          participants: participantsWithInfo
        }
      });

    } catch (error) {
      console.error('❌ Create instructor conversation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========================
  // 📋 GET COURSE CONVERSATIONS
  // ========================
  async getCourseConversations(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.userId || req.user.id;

      const conversations = await Conversation.find({
        courseId,
        'participants.userId': userId
      })
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

      // Populate participants with user info
      const enrichedConversations = await Promise.all(
        conversations.map(async (conversation) => {
          const participantsWithInfo = await Promise.all(
            conversation.participants.map(async (p) => {
              const userData = await this.getUserInfo(p.userId);
              return { ...p.toObject(), user: userData };
            })
          );

          return {
            ...conversation.toObject(),
            participants: participantsWithInfo
          };
        })
      );

      res.json({
        conversations: enrichedConversations
      });

    } catch (error) {
      console.error('Get course conversations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ========================
  // 👤 HELPER: Get User Info
  // ========================
  async getUserInfo(userId) {
    try {
      if (!userId) return null;
      
      const { getUserInfo } = require('../utils/getUserInfo');
      return await getUserInfo(userId);
    } catch (error) {
      console.error('Error fetching user info:', error);
      return {
        _id: userId,
        fullName: 'Unknown User',
        email: 'unknown@email.com'
      };
    }
  }

  // ========================
  // 👀 Mark messages as read
  // ========================
  async markAsRead(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.userId || req.user.id;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.isParticipant(userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await Message.updateMany(
        {
          conversationId,
          'readBy.userId': { $ne: userId },
          senderId: { $ne: userId }
        },
        {
          $push: {
            readBy: {
              userId,
              readAt: new Date()
            }
          }
        }
      );

      req.app.get('io').to(conversationId).emit('messages_read', {
        conversationId,
        userId,
        readAt: new Date()
      });

      res.json({ message: 'Messages marked as read' });

    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new ChatController();
