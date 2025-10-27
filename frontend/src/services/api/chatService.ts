import { 
  Conversation, 
  Message, 
  CreateConversationRequest, 
  SendMessageRequest, 
  GetMessagesResponse, 
  GetConversationsResponse 
} from './../../types/chat.types';
import api from './apiConfig';

export const chatService = {
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
  }
};