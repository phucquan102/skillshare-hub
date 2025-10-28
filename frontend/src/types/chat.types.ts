// ============================================
// chat.types.ts - Updated types
// ============================================

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

export interface CourseInfo {
  title?: string;
  thumbnail?: string;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'course_group' | 'instructor_group'; // ✅ Updated
  participants: Participant[];
  courseId?: string;
  title?: string;
  description?: string;
  courseInfo?: CourseInfo; // ✅ NEW: Lưu trữ thông tin course
  lastMessage?: Message;
  unreadCount: number;
  settings?: {
    allowStudentMessages?: boolean;
    onlyInstructorsCanPost?: boolean;
    autoCreateOnEnrollment?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// ✅ NEW: Request để tạo course conversation
export interface CreateCourseConversationRequest {
  courseTitle?: string; // ✅ QUAN TRỌNG: Gửi courseTitle từ frontend
}

// ✅ Updated: Request để tạo conversation
export interface CreateConversationRequest {
  type: 'direct' | 'course_group' | 'instructor_group';
  participantIds?: string[];
  courseId?: string;
  courseTitle?: string; // ✅ NEW
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

// ✅ Updated: Response từ getCourseInstructors
export interface CourseInstructorsResponse {
  instructors: User[];
  courseTitle: string;
}

// ✅ Updated: Response từ getCourseConversations
export interface CourseConversationsResponse {
  courseId: string;
  conversations: Conversation[];
  total: number;
}

// ✅ NEW: Response từ createCourseConversation
export interface CreateCourseConversationResponse {
  message: string;
  conversation: Conversation;
}

// ✅ NEW: Response từ createInstructorConversation
export interface CreateInstructorConversationResponse {
  message: string;
  conversation: Conversation;
}

// ✅ Updated: Response từ initialize course chat
export interface InitializeCourseChatResponse {
  courseConversation: Conversation;
  instructors: User[];
}

// ✅ NEW: Realtime events
export interface ConversationCreatedEvent {
  conversationId: string;
  type: 'direct' | 'course_group' | 'instructor_group';
  title: string;
  participants: Participant[];
}

export interface InstructorConversationCreatedEvent {
  conversationId: string;
  type: 'direct';
  title: string;
  courseId: string;
  instructorId: string;
  participants: Participant[];
}

export interface InstructorsFetchedEvent {
  courseId: string;
  courseTitle: string;
  instructors: User[];
}

export interface ConversationsUpdatedEvent {
  courseId: string;
  conversations: Conversation[];
  total: number;
}

export interface NewMessageEvent {
  conversationId: string;
  senderId: string | User;
  content: string;
  createdAt: string;
}

export interface MessagesReadEvent {
  conversationId: string;
  userId: string;
  readAt: string;
}