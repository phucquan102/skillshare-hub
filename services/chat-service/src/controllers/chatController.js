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
