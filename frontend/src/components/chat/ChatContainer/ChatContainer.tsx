import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from './../../../types/chat.types';
import { chatService } from './../../../services/api/chatService';
import { ChatSidebar } from '../ChatSidebar/ChatSidebar';
import { MessageList } from '../MessageList/MessageList';
import { MessageInput } from '../MessageInput/MessageInput';
import styles from './ChatContainer.module.scss';
import { useAuth } from './../../../context/AuthContext';
import { socket } from "../../../utils/socket";

// ========================
// 🎯 GIẢI PHÁP: Auto-fetch instructors khi component mount
// ========================

interface ChatContainerProps {
  initialConversationId?: string;
  courseId?: string;
  courseName?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  initialConversationId, 
  courseId,
  courseName
}) => {
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseInstructors, setCourseInstructors] = useState<any[]>([]);
  const [courseConversation, setCourseConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'instructors'>('chats');
  const [instructorLoading, setInstructorLoading] = useState(false);
  
  const currentConversationIdRef = useRef<string | null>(null);

  // ========================
  // 👨‍🏫 LẤY DANH SÁCH INSTRUCTORS - CẢI TIẾN
  // ========================
  const loadCourseInstructors = async (courseId: string) => {
    try {
      console.log('👨‍🏫 Loading instructors for course:', courseId);
      setInstructorLoading(true);
      
      const response = await chatService.getCourseInstructors(courseId);
      
      console.log('📦 Instructors response (FULL):', JSON.stringify(response, null, 2));
      console.log('📦 Response type:', typeof response);
      console.log('📦 Is array?', Array.isArray(response));
      console.log('📦 response.instructors:', response?.instructors);
      console.log('📦 response.instructors type:', typeof response?.instructors);
      console.log('📦 Is response.instructors array?', Array.isArray(response?.instructors));
      
      // ✅ Xử lý linh hoạt dữ liệu từ API
      let instructors = [];
      
      if (response?.instructors && Array.isArray(response.instructors)) {
        instructors = response.instructors;
        console.log('✅ Path 1: Got instructors from response.instructors');
      } else if (Array.isArray(response)) {
        instructors = response;
        console.log('✅ Path 2: Response is direct array');
      } else if ((response as any)?.data && Array.isArray((response as any).data)) {
        instructors = (response as any).data;
        console.log('✅ Path 3: Got instructors from response.data');
      }
      
      console.log('✅ Final extracted instructors:', instructors);
      console.log('✅ Instructors count:', instructors.length);
      
      if (instructors.length > 0) {
        console.log('✅ First instructor:', instructors[0]);
      }
      
      setCourseInstructors(instructors);
      
      return instructors;
    } catch (error: any) {
      console.error('❌ Failed to load instructors:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error response:', error.response?.data);
      setCourseInstructors([]);
      return [];
    } finally {
      setInstructorLoading(false);
    }
  };

  // ========================
  // 🎓 KHỞI TẠO COURSE CHAT
  // ========================
  const initializeCourseChat = async (courseId: string) => {
    try {
      console.log('🔄 Initializing course chat for:', courseId);
      
      // 1️⃣ TẢI INSTRUCTORS TRƯỚC
      const instructors = await loadCourseInstructors(courseId);
      console.log('✅ Instructors loaded:', instructors.length);
      
      // 2️⃣ TẠO/LẤY COURSE CONVERSATION
      try {
        const existingConversations = await chatService.getConversations();
        const existingCourseConversation = existingConversations.conversations.find(
          (conv: Conversation) => 
            conv.courseId === courseId && conv.type === 'course_group'
        );

        let courseConversation;
        
        if (existingCourseConversation) {
          console.log('📚 Found existing course conversation:', existingCourseConversation._id);
          courseConversation = existingCourseConversation;
        } else {
          console.log('📤 Creating new course conversation with title:', courseName);
          const conversationData = await chatService.createCourseConversation(
            courseId,
            courseName || `Course ${courseId}`
          );
          courseConversation = conversationData.conversation;
          console.log('✅ Course conversation created:', courseConversation?._id);
        }
        
        setCourseConversation(courseConversation);
        
        // 3️⃣ LOAD LẠI CONVERSATIONS
        await loadConversations();
        
        // 4️⃣ AUTO-SELECT COURSE CONVERSATION
        if (courseConversation) {
          handleSelectCourseConversation(courseConversation);
        }
        
      } catch (conversationError: any) {
        console.error('❌ Failed to create/get course conversation:', conversationError);
        setCourseConversation(null);
      }
      
    } catch (error: any) {
      console.error('❌ Failed to initialize course chat:', error);
      setError('Không thể khởi tạo tính năng thảo luận. Vui lòng thử lại sau.');
    }
  };

  // ========================
  // 💬 CHAT 1-1 VỚI INSTRUCTOR
  // ========================
  const handleStartInstructorConversation = async (instructorId: string) => {
    if (!courseId) {
      console.warn('⚠️ No courseId, cannot start instructor conversation');
      setError('Không thể xác định khóa học. Vui lòng thử lại.');
      return;
    }
    
    try {
      console.log('💬 Starting 1-1 chat with instructor:', instructorId);
      
      const existingConversations = await chatService.getConversations();
      const existingConversation = existingConversations.conversations.find((conv: Conversation) => 
        conv.type === 'direct' && 
        conv.courseId === courseId &&
        conv.participants.some(p => p.userId === instructorId)
      );

      let conversation;
      
      if (existingConversation) {
        console.log('🔍 Found existing conversation:', existingConversation._id);
        conversation = existingConversation;
      } else {
        console.log('🆕 Creating new instructor conversation');
        const result = await chatService.createInstructorConversation(courseId, instructorId);
        conversation = result.conversation;
      }
      
      if (currentConversationIdRef.current) {
        socket.emit("leave_conversation", currentConversationIdRef.current);
      }
      
      setSelectedConversation(conversation);
      currentConversationIdRef.current = conversation._id;
      setActiveTab('chats');
      await loadConversations();
      
      console.log('✅ 1-1 Instructor conversation started:', conversation._id);
    } catch (error: any) {
      console.error('❌ Failed to start 1-1 chat with instructor:', error);
      setError('Không thể bắt đầu trò chuyện với giảng viên.');
    }
  };

  // ========================
  // 👥 CHỌN COURSE GROUP CONVERSATION
  // ========================
  const handleSelectCourseConversation = (conversation?: Conversation) => {
    const targetConversation = conversation || courseConversation;
    if (!targetConversation) {
      console.warn('⚠️ No course conversation to select');
      setError('Chưa có nhóm thảo luận cho khóa học này.');
      return;
    }
    
    console.log('👥 Selecting course conversation:', targetConversation._id);
    
    if (currentConversationIdRef.current) {
      socket.emit("leave_conversation", currentConversationIdRef.current);
    }
    
    setSelectedConversation(targetConversation);
    currentConversationIdRef.current = targetConversation._id;
    setActiveTab('chats');
    setError(null);
    loadMessages(targetConversation._id);
  };

  // ========================
  // 📋 LOAD CONVERSATIONS
  // ========================
  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      console.log('📋 Loaded conversations:', data.conversations.length);
      setConversations(data.conversations);

      let targetConversation = null;
      
      if (initialConversationId) {
        targetConversation = data.conversations.find((c) => c._id === initialConversationId);
      }
      
      if (!targetConversation && courseConversation) {
        targetConversation = courseConversation;
      }
      
      if (!targetConversation && data.conversations.length > 0) {
        targetConversation = data.conversations[0];
      }

      if (targetConversation) {
        setSelectedConversation(targetConversation);
        currentConversationIdRef.current = targetConversation._id;
        loadMessages(targetConversation._id);
      }
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError('Không thể tải danh sách hội thoại.');
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // 💌 LOAD MESSAGES
  // ========================
  const loadMessages = async (conversationId: string) => {
    try {
      console.log('💌 Loading messages for conversation:', conversationId);
      const data = await chatService.getMessages(conversationId);
      setMessages(data.messages);
      await chatService.markAsRead(conversationId);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError('Không thể tải tin nhắn.');
    }
  };

  // ========================
  // ✉️ SEND MESSAGE
  // ========================
  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) {
      setError('Vui lòng chọn một hội thoại để gửi tin nhắn.');
      return;
    }
    
    try {
      const { data: newMessage } = await chatService.sendMessage({
        conversationId: selectedConversation._id,
        content,
      });

      setMessages((prev) => [...prev, newMessage]);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('Không thể gửi tin nhắn.');
    }
  };

  // ========================
  // SELECT CONVERSATION
  // ========================
  const handleSelectConversation = (conversation: Conversation) => {
    if (currentConversationIdRef.current) {
      socket.emit("leave_conversation", currentConversationIdRef.current);
    }
    
    setSelectedConversation(conversation);
    currentConversationIdRef.current = conversation._id;
    setActiveTab('chats');
    setError(null);
    loadMessages(conversation._id);
  };

  // ========================
  // START NEW CONVERSATION
  // ========================
  const handleStartNewConversation = async (participantId: string) => {
    try {
      const conversation = await chatService.findOrCreateDirectConversation(participantId);
      
      if (currentConversationIdRef.current) {
        socket.emit("leave_conversation", currentConversationIdRef.current);
      }
      
      setSelectedConversation(conversation);
      currentConversationIdRef.current = conversation._id;
      setActiveTab('chats');
      await loadConversations();
    } catch (err: any) {
      console.error('Error starting conversation:', err);
      setError('Không thể tạo hội thoại mới.');
    }
  };

  // ========================
  // EFFECTS - CẢI TIẾN
  // ========================
  
  // ✅ Initial load + Load instructors khi có courseId
  useEffect(() => {
    console.log('🚀 ChatContainer mounted');
    console.log('📌 Props - courseId:', courseId, 'courseName:', courseName);
    
    loadConversations();
    
    // ✅ NẾU CÓ COURSEID, KHỞI TẠO COURSE CHAT VÀ TẢI INSTRUCTORS
    if (courseId) {
      console.log('🎓 Initializing course chat...');
      initializeCourseChat(courseId);
    }
    
    return () => {
      if (currentConversationIdRef.current) {
        socket.emit("leave_conversation", currentConversationIdRef.current);
      }
    };
  }, [courseId, courseName]);

  // Realtime socket listener
  useEffect(() => {
    if (!selectedConversation?._id) return;

    console.log('Joining conversation:', selectedConversation._id);
    socket.emit("join_conversation", selectedConversation._id);

    const handleNewMessage = (msg: Message) => {
      console.log('Received new message:', msg);
      if (msg.conversationId === selectedConversation._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) {
            return prev;
          }
          return [...prev, msg];
        });
      }
    };

    socket.off("new_message", handleNewMessage);
    socket.on("new_message", handleNewMessage);

    loadMessages(selectedConversation._id);

    return () => {
      console.log('Cleaning up socket listeners for conversation:', selectedConversation._id);
      socket.off("new_message", handleNewMessage);
    };
  }, [selectedConversation?._id]);

  // ========================
  // RENDER
  // ========================
  
  if (loading && conversations.length === 0) {
    return <div className={styles.loading}>Đang tải hội thoại...</div>;
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.sidebar}>
        <ChatSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          onStartNewConversation={handleStartNewConversation}
          currentUser={user}
          courseId={courseId}
          courseInstructors={courseInstructors}
          courseConversation={courseConversation}
          onStartInstructorConversation={handleStartInstructorConversation}
          onSelectCourseConversation={() => handleSelectCourseConversation()}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      <div className={styles.chatArea}>
        {selectedConversation ? (
          <>
            <div className={styles.chatHeader}>
              <h3>
                {selectedConversation.type === 'direct'
                  ? selectedConversation.participants.find((p) => p.userId !== user?._id)?.user?.fullName ||
                    'Người dùng'
                  : selectedConversation.title || 'Thảo luận nhóm'}
              </h3>
              <span className={styles.chatInfo}>
                {selectedConversation.type === 'direct' ? 'Tin nhắn riêng' : 'Thảo luận nhóm'}
                {selectedConversation._id === courseConversation?._id && ' • Thảo luận khóa học'}
              </span>
            </div>

            <div className={styles.messagesContainer}>
              <MessageList messages={messages} currentUserId={user?._id || ''} />
            </div>
            
            <MessageInput onSendMessage={handleSendMessage} disabled={!selectedConversation} />
          </>
        ) : (
          <div className={styles.noConversation}>
            <h3>Chào mừng đến với Thảo luận</h3>
            <p>Chọn một hội thoại hoặc bắt đầu cuộc trò chuyện mới</p>
            
            {courseId && (
              <div className={styles.courseActions}>
                <p>Khóa học: <strong>{courseName || courseId}</strong></p>
                
                {/* ✅ HIỂN THỊ LOADING KHI ĐANG TẢI INSTRUCTORS */}
                {instructorLoading ? (
                  <div className={styles.loadingInstructors}>
                    <span>⏳ Đang tải danh sách giảng viên...</span>
                  </div>
                ) : courseInstructors.length > 0 ? (
                  <div className={styles.instructorsPreview}>
                    <p>👨‍🏫 Giảng viên có sẵn: <strong>{courseInstructors.length}</strong></p>
                    {courseInstructors.map(instructor => (
                      <div key={instructor._id} className={styles.instructorQuick}>
                        <span>{instructor.fullName}</span>
                        <button 
                          onClick={() => handleStartInstructorConversation(instructor._id)}
                          className={styles.quickChatButton}
                        >
                          💬 Chat
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => setActiveTab('instructors')}
                      className={styles.viewInstructorsButton}
                    >
                      Xem đầy đủ danh sách
                    </button>
                  </div>
                ) : (
                  <div className={styles.noInstructors}>
                    <p>Chưa có giảng viên nào trong khóa học này</p>
                  </div>
                )}
                
                <button 
                  onClick={() => initializeCourseChat(courseId)}
                  className={styles.initializeCourseChatButton}
                >
                  {courseConversation ? '🔄 Tải lại thảo luận' : '🆕 Khởi tạo thảo luận khóa học'}
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>Đóng</button>
          </div>
        )}
      </div>
    </div>
  );
};