export interface User {
  _id: string;
  fullName: string;
  email: string;
  profile?: {
    avatar?: string;
    bio?: string;
  };
  role: string;
}

export interface Participant {
  userId: string;
  role: string;
  joinedAt: string;
  lastReadMessage?: string;
  user?: User;
  _id?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string | User;
  content: string;
  type: 'text' | 'system';
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'course';
  participants: Participant[];
  courseId?: string;
  title?: string;
  description?: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationRequest {
  type: 'direct' | 'course';
  participantIds: string[];
  courseId?: string;
  title?: string;
  description?: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

export interface GetMessagesResponse {
  messages: Message[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GetConversationsResponse {
  conversations: Conversation[];
  page: number;
  limit: number;
}