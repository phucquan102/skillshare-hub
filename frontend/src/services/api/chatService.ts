import { 
  Conversation, 
  Message, 
  CreateConversationRequest, 
  SendMessageRequest, 
  GetMessagesResponse, 
  GetConversationsResponse,
  CreateCourseConversationResponse 
} from './../../types/chat.types';
import api from './apiConfig';

export const chatService = {
  // ========================
  // 💬 Basic Chat Functions
  // ========================

  // Lấy danh sách conversations
  getConversations: async (page = 1, limit = 20): Promise<GetConversationsResponse> => {
    const response = await api.get(`/chat/conversations?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Tạo conversation mới
  createConversation: async (data: CreateConversationRequest): Promise<{ message: string; conversation: Conversation }> => {
    const response = await api.post('/chat/conversations', data);
    return response.data;
  },

  // Lấy tin nhắn trong conversation
  getMessages: async (conversationId: string, page = 1, limit = 50): Promise<GetMessagesResponse> => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Gửi tin nhắn
  sendMessage: async (data: SendMessageRequest): Promise<{ message: string; data: Message }> => {
    const response = await api.post('/chat/messages', data);
    return response.data;
  },

  // Đánh dấu đã đọc
  markAsRead: async (conversationId: string): Promise<{ message: string }> => {
    const response = await api.post(`/chat/conversations/${conversationId}/read`);
    return response.data;
  },

  // ========================
  // 🎓 Course Chat Functions
  // ========================

  // Lấy danh sách instructors của khóa học
  getCourseInstructors: async (courseId: string): Promise<{ 
    instructors: any[]; 
    courseTitle: string 
  }> => {
    const response = await api.get(`/chat/courses/${courseId}/instructors`);
    return response.data;
  },

  // ✅ FIXED: Tạo hoặc tham gia conversation của khóa học
  // Gửi courseTitle từ frontend
  createCourseConversation: async (
    courseId: string, 
    courseTitle?: string // ✅ THÊM: courseTitle parameter
  ): Promise<CreateCourseConversationResponse> => {
    console.log('📤 [chatService] Creating course conversation:');
    console.log('   courseId:', courseId);
    console.log('   courseTitle:', courseTitle);

    const response = await api.post(
      `/chat/courses/${courseId}/conversation`,
      {
        courseTitle: courseTitle // ✅ GỬI courseTitle
      }
    );
    
    console.log('✅ [chatService] Response:', response.data.conversation.title);
    return response.data;
  },

  // Lấy tất cả conversations của khóa học
  getCourseConversations: async (courseId: string): Promise<{ 
    courseId: string; 
    conversations: Conversation[]; 
    total: number 
  }> => {
    const response = await api.get(`/chat/courses/${courseId}/conversations`);
    return response.data;
  },

  // Tạo conversation với instructor (trong khóa học)
  createInstructorConversation: async (courseId: string, instructorId: string): Promise<{ 
    message: string; 
    conversation: Conversation 
  }> => {
    const response = await api.post(`/chat/courses/${courseId}/instructors/${instructorId}/conversation`);
    return response.data;
  },

  // ========================
  // 🔍 Utility Functions
  // ========================

  // Tìm hoặc tạo direct conversation
  findOrCreateDirectConversation: async (participantId: string): Promise<Conversation> => {
    try {
      // Thử tìm conversation trực tiếp
      const { conversations } = await chatService.getConversations();
      const existingConversation = conversations.find(conv => 
        conv.type === 'direct' && 
        conv.participants.some(p => p.userId === participantId)
      );
      
      if (existingConversation) {
        return existingConversation;
      }

      // Tạo conversation mới nếu không tìm thấy
      const { conversation } = await chatService.createConversation({
        type: 'direct',
        participantIds: [participantId]
      });
      
      return conversation;
    } catch (error) {
      console.error('Error finding or creating conversation:', error);
      throw error;
    }
  },

  // ✅ FIXED: Tìm hoặc tạo course conversation
  // Nhận courseTitle parameter
  findOrCreateCourseConversation: async (
    courseId: string,
    courseTitle?: string // ✅ THÊM: courseTitle parameter
  ): Promise<Conversation> => {
    try {
      console.log('📌 [chatService] Finding or creating course conversation:');
      console.log('   courseId:', courseId);
      console.log('   courseTitle:', courseTitle);

      // Thử lấy conversation khóa học đã có
      const { conversations } = await chatService.getCourseConversations(courseId);
      if (conversations.length > 0) {
        console.log('✅ [chatService] Found existing conversation:', conversations[0].title);
        return conversations[0];
      }

      // Tạo conversation mới nếu không tìm thấy
      const { conversation } = await chatService.createCourseConversation(
        courseId,
        courseTitle // ✅ GỬI courseTitle
      );
      console.log('✅ [chatService] Created new conversation:', conversation.title);
      return conversation;
    } catch (error) {
      console.error('Error finding or creating course conversation:', error);
      throw error;
    }
  },

  // ✅ FIXED: Kiểm tra và khởi tạo chat cho khóa học
  // Nhận courseTitle parameter
  initializeCourseChat: async (
    courseId: string,
    courseTitle?: string // ✅ THÊM: courseTitle parameter
  ): Promise<{
    courseConversation: Conversation;
    instructors: any[];
  }> => {
    try {
      console.log('🎯 [chatService] Initializing course chat:');
      console.log('   courseId:', courseId);
      console.log('   courseTitle:', courseTitle);

      const [courseConversation, instructorsData] = await Promise.all([
        chatService.findOrCreateCourseConversation(courseId, courseTitle), // ✅ GỬI courseTitle
        chatService.getCourseInstructors(courseId)
      ]);

      console.log('✅ [chatService] Course chat initialized');

      return {
        courseConversation,
        instructors: instructorsData.instructors
      };
    } catch (error) {
      console.error('Error initializing course chat:', error);
      throw error;
    }
  }
};