// src/services/api/chatService.ts - FULLY FIXED

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
  // 🎓 Course Chat Functions - FIXED
  // ========================

  // ✅ FIX: Lấy danh sách instructors từ Course Service
  getCourseInstructors: async (courseId: string): Promise<{ 
    instructors: any[]; 
    courseTitle: string 
  }> => {
    try {
      console.log('🎯 [chatService.getCourseInstructors] Starting...');
      console.log('   courseId:', courseId);
      
      if (!courseId) {
        console.warn('⚠️ No courseId provided');
        return { instructors: [], courseTitle: 'Unknown' };
      }

      // ✅ FIX: Gọi endpoint từ Course Service thay vì Chat Service
      const endpoint = `/courses/${courseId}`;
      console.log('   endpoint:', endpoint);
      console.log('📤 Making API request to Course Service...');
      
      const response = await api.get(endpoint);
      
      console.log('✅ Response received:');
      console.log('   status:', response.status);
      console.log('   data keys:', Object.keys(response.data).slice(0, 5));
      
      // ✅ Extract instructors from response
      const course = response.data.data || response.data;
      
      let instructors = [];
      let courseTitle = '';

      // Try different field names for instructors
      if (course.instructorIds && Array.isArray(course.instructorIds)) {
        console.log('✅ Found instructorIds (array)');
        instructors = course.instructorIds;
      } else if (course.instructors && Array.isArray(course.instructors)) {
        console.log('✅ Found instructors (array)');
        instructors = course.instructors;
      } else if (course.instructor && Array.isArray(course.instructor)) {
        console.log('✅ Found instructor (array)');
        instructors = course.instructor;
      } else if (course.createdBy) {
        console.log('✅ Found createdBy, wrapping as array');
        instructors = [course.createdBy];
      }

      // Try different field names for course title
      courseTitle = course.title || course.name || course.courseName || 'Unknown Course';

      console.log('✅ [chatService.getCourseInstructors] Success');
      console.log('   instructors count:', instructors.length);
      console.log('   courseTitle:', courseTitle);

      return { 
        instructors: instructors || [], 
        courseTitle 
      };
      
    } catch (error: any) {
      console.error('❌ [chatService.getCourseInstructors] Error:');
      console.error('   message:', error.message);
      console.error('   code:', error.code);
      
      // Log response error details
      if (error.response) {
        console.error('   HTTP Status:', error.response.status);
        console.error('   Response data:', error.response.data);
      }
      
      // Log request details
      if (error.config) {
        console.error('   Request URL:', error.config.url);
        console.error('   Request method:', error.config.method);
      }
      
      console.warn('⚠️ Returning empty instructors array');
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
    try {
      const response = await api.get(`/chat/courses/${courseId}/conversations`);
      return response.data;
    } catch (error: any) {
      console.error('❌ [chatService.getCourseConversations] Error:', error.message);
      // Return empty conversations array on error
      return {
        courseId,
        conversations: [],
        total: 0
      };
    }
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
      console.log('   endpoint:', endpoint);
      
      const response = await api.post(endpoint);
      
      console.log('✅ [chatService.createInstructorConversation] Success');
      console.log('   conversation id:', response.data.conversation?._id);
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
      console.log('🔍 [chatService.findOrCreateDirectConversation] Looking for:', participantId);
      
      const { conversations } = await chatService.getConversations();
      const existingConversation = conversations.find(conv => 
        conv.type === 'direct' && 
        conv.participants.some(p => p.userId === participantId)
      );
      
      if (existingConversation) {
        console.log('✅ Found existing conversation:', existingConversation._id);
        return existingConversation;
      }

      console.log('🆕 Creating new direct conversation');
      const { conversation } = await chatService.createConversation({
        type: 'direct',
        participantIds: [participantId]
      });
      
      console.log('✅ Created conversation:', conversation._id);
      return conversation;
    } catch (error) {
      console.error('❌ Error finding or creating conversation:', error);
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

      const courseConversations = await chatService.getCourseConversations(courseId);
      
      if (courseConversations.conversations && courseConversations.conversations.length > 0) {
        console.log('✅ Found existing course conversation:', courseConversations.conversations[0].title);
        return courseConversations.conversations[0];
      }

      console.log('🆕 Creating new course conversation');
      const { conversation } = await chatService.createCourseConversation(courseId, courseTitle);
      console.log('✅ Created course conversation:', conversation.title);
      return conversation;
    } catch (error) {
      console.error('❌ Error finding or creating course conversation:', error);
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

      // ✅ Fetch both course conversation and instructors in parallel
      const [courseConversation, instructorsData] = await Promise.all([
        chatService.findOrCreateCourseConversation(courseId, courseTitle),
        chatService.getCourseInstructors(courseId)
      ]);

      console.log('✅ [chatService.initializeCourseChat] Complete');
      console.log('   conversation id:', courseConversation._id);
      console.log('   instructors count:', instructorsData.instructors.length);

      return {
        courseConversation,
        instructors: instructorsData.instructors || []
      };
    } catch (error) {
      console.error('❌ [chatService.initializeCourseChat] Error:', error);
      throw error;
    }
  }
};