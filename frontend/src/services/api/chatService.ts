// src/services/api/chatService.ts - UPDATED WITH DEBUG

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

  getConversations: async (page = 1, limit = 20): Promise<GetConversationsResponse> => {
    const response = await api.get(`/chat/conversations?page=${page}&limit=${limit}`);
    return response.data;
  },

  createConversation: async (data: CreateConversationRequest): Promise<{ message: string; conversation: Conversation }> => {
    const response = await api.post('/chat/conversations', data);
    return response.data;
  },

  getMessages: async (conversationId: string, page = 1, limit = 50): Promise<GetMessagesResponse> => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  },

  sendMessage: async (data: SendMessageRequest): Promise<{ message: string; data: Message }> => {
    const response = await api.post('/chat/messages', data);
    return response.data;
  },

  markAsRead: async (conversationId: string): Promise<{ message: string }> => {
    const response = await api.post(`/chat/conversations/${conversationId}/read`);
    return response.data;
  },

  // ========================
  // 🎓 Course Chat Functions - FIXED WITH DEBUG
  // ========================

  // ✅ FIX 1: Lấy danh sách instructors của khóa học
  getCourseInstructors: async (courseId: string): Promise<{ 
    instructors: any[]; 
    courseTitle: string 
  }> => {
    try {
      console.log('🎯 [chatService.getCourseInstructors] Starting...');
      console.log('   courseId:', courseId);
      
      // ✅ DEBUG: Log endpoint
      const endpoint = `/chat/courses/${courseId}/instructors`;
      console.log('   endpoint:', endpoint);
      
      // ✅ DEBUG: Log request config
      console.log('   method: GET');
      console.log('   headers:', { 'Content-Type': 'application/json' });
      
      console.log('📤 Making API request...');
      const response = await api.get(endpoint);
      
      console.log('✅ Response received:');
      console.log('   status:', response.status);
      console.log('   statusText:', response.statusText);
      console.log('   data:', JSON.stringify(response.data, null, 2));
      
      // ✅ DEBUG: Validate response structure
      if (!response.data) {
        console.error('❌ Response data is empty!');
        return { instructors: [], courseTitle: 'Unknown' };
      }
      
      if (!response.data.instructors) {
        console.warn('⚠️ Response missing "instructors" field');
        console.warn('   Available fields:', Object.keys(response.data));
        
        // Try alternate field names
        if (Array.isArray(response.data)) {
          console.log('✅ Response is direct array, using as instructors');
          return { instructors: response.data, courseTitle: 'Unknown' };
        }
        
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log('✅ Found data in response.data.data');
          return { instructors: response.data.data, courseTitle: response.data.courseTitle || 'Unknown' };
        }
      }
      
      console.log('✅ [chatService.getCourseInstructors] Success');
      return response.data;
      
    } catch (error: any) {
      console.error('❌ [chatService.getCourseInstructors] Error:');
      console.error('   message:', error.message);
      console.error('   code:', error.code);
      
      // Log response error details
      if (error.response) {
        console.error('   HTTP Status:', error.response.status);
        console.error('   Response data:', error.response.data);
        console.error('   Response headers:', error.response.headers);
      }
      
      // Log request details
      if (error.config) {
        console.error('   Request URL:', error.config.url);
        console.error('   Request method:', error.config.method);
        console.error('   Request headers:', error.config.headers);
      }
      
      // Return empty result instead of throwing
      return { instructors: [], courseTitle: 'Unknown' };
    }
  },

  createCourseConversation: async (
    courseId: string, 
    courseTitle?: string
  ): Promise<CreateCourseConversationResponse> => {
    try {
      console.log('📤 [chatService.createCourseConversation] Creating course conversation:');
      console.log('   courseId:', courseId);
      console.log('   courseTitle:', courseTitle);

      const endpoint = `/chat/courses/${courseId}/conversation`;
      const body = { courseTitle: courseTitle };
      
      console.log('   endpoint:', endpoint);
      console.log('   body:', body);

      const response = await api.post(endpoint, body);
      
      console.log('✅ [chatService.createCourseConversation] Response:', response.data.conversation?.title);
      return response.data;
    } catch (error: any) {
      console.error('❌ [chatService.createCourseConversation] Error:', error.message);
      if (error.response?.data) {
        console.error('   Server error:', error.response.data);
      }
      throw error;
    }
  },

  getCourseConversations: async (courseId: string): Promise<{ 
    courseId: string; 
    conversations: Conversation[]; 
    total: number 
  }> => {
    const response = await api.get(`/chat/courses/${courseId}/conversations`);
    return response.data;
  },

  createInstructorConversation: async (courseId: string, instructorId: string): Promise<{ 
    message: string; 
    conversation: Conversation 
  }> => {
    try {
      console.log('💬 [chatService.createInstructorConversation] Starting:');
      console.log('   courseId:', courseId);
      console.log('   instructorId:', instructorId);

      const endpoint = `/chat/courses/${courseId}/instructors/${instructorId}/conversation`;
      
      const response = await api.post(endpoint);
      
      console.log('✅ [chatService.createInstructorConversation] Success');
      return response.data;
    } catch (error: any) {
      console.error('❌ [chatService.createInstructorConversation] Error:');
      console.error('   message:', error.message);
      if (error.response?.data) {
        console.error('   Server error:', error.response.data);
      }
      throw error;
    }
  },

  // ========================
  // 🔍 Utility Functions
  // ========================

  findOrCreateDirectConversation: async (participantId: string): Promise<Conversation> => {
    try {
      const { conversations } = await chatService.getConversations();
      const existingConversation = conversations.find(conv => 
        conv.type === 'direct' && 
        conv.participants.some(p => p.userId === participantId)
      );
      
      if (existingConversation) {
        return existingConversation;
      }

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

  findOrCreateCourseConversation: async (
    courseId: string,
    courseTitle?: string
  ): Promise<Conversation> => {
    try {
      console.log('📌 [chatService.findOrCreateCourseConversation] Starting:');
      console.log('   courseId:', courseId);
      console.log('   courseTitle:', courseTitle);

      const { conversations } = await chatService.getCourseConversations(courseId);
      if (conversations.length > 0) {
        console.log('✅ Found existing conversation:', conversations[0].title);
        return conversations[0];
      }

      const { conversation } = await chatService.createCourseConversation(courseId, courseTitle);
      console.log('✅ Created new conversation:', conversation.title);
      return conversation;
    } catch (error) {
      console.error('Error finding or creating course conversation:', error);
      throw error;
    }
  },

  initializeCourseChat: async (
    courseId: string,
    courseTitle?: string
  ): Promise<{
    courseConversation: Conversation;
    instructors: any[];
  }> => {
    try {
      console.log('🎯 [chatService.initializeCourseChat] Starting:');
      console.log('   courseId:', courseId);
      console.log('   courseTitle:', courseTitle);

      const [courseConversation, instructorsData] = await Promise.all([
        chatService.findOrCreateCourseConversation(courseId, courseTitle),
        chatService.getCourseInstructors(courseId)
      ]);

      console.log('✅ [chatService.initializeCourseChat] Complete');
      console.log('   instructors:', instructorsData.instructors.length);

      return {
        courseConversation,
        instructors: instructorsData.instructors
      };
    } catch (error) {
      console.error('❌ [chatService.initializeCourseChat] Error:', error);
      throw error;
    }
  }
};