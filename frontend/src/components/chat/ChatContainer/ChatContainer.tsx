import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from './../../../types/chat.types';
import { chatService } from './../../../services/api/chatService';
import { ChatSidebar } from '../ChatSidebar/ChatSidebar';
import { MessageList } from '../MessageList/MessageList';
import { MessageInput } from '../MessageInput/MessageInput';
import styles from './ChatContainer.module.scss';
import { useAuth } from './../../../context/AuthContext';
import { socket } from "../../../utils/socket";

interface ChatContainerProps {
  initialConversationId?: string;
  courseId?: string;
  courseName?: string;
}

// ✅ ĐỊNH NGHĨA INTERFACE CHO INSTRUCTORS RESPONSE
interface InstructorsResponse {
  instructors: any[];
  courseTitle: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  initialConversationId, 
  courseId,
  courseName
}) => {
  const { user } = useAuth();
  
  console.log('🎯 ChatContainer - user:', user?._id);
  console.log('🎯 ChatContainer - courseId:', courseId);
  console.log('🎯 ChatContainer - courseName:', courseName);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseInstructors, setCourseInstructors] = useState<any[]>([]);
  const [courseConversation, setCourseConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'instructors'>('chats');
  
  const currentConversationIdRef = useRef<string | null>(null);

  // ========================
  // 🎓 KHỞI TẠO CHAT CHO KHÓA HỌC - ĐÃ SỬA LỖI TYPESCRIPT
  // ========================
  const initializeCourseChat = async (courseId: string) => {
    try {
      console.log('🔄 Initializing course chat for:', courseId);
      console.log('📝 Course name to send:', courseName);
      
      // ✅ Biến 'instructors' này là biến duy nhất, được dùng chung
      let instructors: any[] = []; 
      let courseConversation = null;

      // ----- BẮT ĐẦU FETCH INSTRUCTORS -----
      try {
        console.log('🔍 Attempting to fetch instructors for course:', courseId);
        
        // Tạm thời bỏ 'as InstructorsResponse' để kiểm tra linh hoạt
        const instructorsData: any = await chatService.getCourseInstructors(courseId);
        
        console.log('📦 Raw instructors API response:', instructorsData);
        console.log('📦 Response type:', typeof instructorsData);
        
        // 🛑 LỖI ĐÃ SỬA:
        // Đã XÓA dòng "let instructors: any[] = [];" ở đây.
        // Giờ code bên dưới sẽ gán giá trị cho biến 'instructors' ở BÊN NGOÀI.

        // ✅ Logic lấy dữ liệu linh hoạt (an toàn hơn)
        if (instructorsData && typeof instructorsData === 'object' && !Array.isArray(instructorsData)) {
          // 1. Ưu tiên 1: { instructors: [...] } (theo interface của bạn)
          if (Array.isArray(instructorsData.instructors)) {
            instructors = instructorsData.instructors;
          }
          // 2. Ưu tiên 2: { data: [...] } (cấu trúc API phổ biến)
          else if (Array.isArray(instructorsData.data)) {
            instructors = instructorsData.data;
          }
          // 3. Ưu tiên 3: { users: [...] } (cũng có thể)
          else if (Array.isArray(instructorsData.users)) {
            instructors = instructorsData.users;
          }
        } 
        // 4. Ưu tiên 4: API trả về thẳng một mảng [...]
        else if (Array.isArray(instructorsData)) {
          instructors = instructorsData;
        }
        
        console.log('✅ Instructors extracted:', instructors.length, 'items');
        console.log('✅ Instructors data:', instructors);
        
      } catch (instructorError: any) {
        console.error('❌ Failed to load instructors:', instructorError);
        console.error('❌ Error details:', instructorError.response?.data || instructorError.message);
        instructors = []; // Gán cho biến bên ngoài khi có lỗi
      }
      // ----- KẾT THÚC FETCH INSTRUCTORS -----


      // ----- BẮT ĐẦU TẠO/LẤY COURSE CONVERSATION -----
      try {
        const existingConversations = await chatService.getConversations();
        const existingCourseConversation = existingConversations.conversations.find(
          (conv: Conversation) => 
            conv.courseId === courseId && conv.type === 'course_group'
        );

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
      } catch (conversationError: any) {
        console.error('❌ Failed to create/get course conversation:', conversationError);
        console.error('❌ Error details:', conversationError.response?.data || conversationError.message);
        courseConversation = null;
      }
      // ----- KẾT THÚC TẠO/LẤY COURSE CONVERSATION -----

      
      // ✅ Update state (Giờ 'instructors' đã có dữ liệu)
      console.log('🎯 Setting state:');
      console.log('   - courseInstructors:', instructors); // <-- Sẽ in ra đúng
      console.log('   - courseConversation:', courseConversation);
      
      setCourseInstructors(instructors); // <-- Sẽ set state đúng
      setCourseConversation(courseConversation);
      
      // ✅ Load lại conversations để cập nhật
      await loadConversations();
      
      // ✅ Auto-select course conversation nếu có
      if (courseConversation) {
        handleSelectCourseConversation(courseConversation);
      } else if (instructors.length > 0) {
        console.log('⚠️ No course conversation, starting 1-1 with first instructor');
        handleStartInstructorConversation(instructors[0]._id);
      }
      
    } catch (error: any) {
      console.error('❌ Failed to initialize course chat:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      setError('Không thể khởi tạo tính năng thảo luận. Vui lòng thử lại sau.');
    }
  };
  // ========================
  // 💬 CHAT 1-1 VỚI INSTRUCTOR - ĐÃ SỬA
  // ========================
  const handleStartInstructorConversation = async (instructorId: string) => {
    if (!courseId) {
      console.warn('⚠️ No courseId, cannot start instructor conversation');
      setError('Không thể xác định khóa học. Vui lòng thử lại.');
      return;
    }
    
    try {
      console.log('💬 Starting 1-1 chat with instructor:', instructorId);
      
      // Tìm conversation đã tồn tại trước
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
      console.error('❌ Error details:', error.response?.data || error.message);
      setError('Không thể bắt đầu trò chuyện với giảng viên.');
    }
  };

  // ========================
  // 👥 CHỌN COURSE GROUP CONVERSATION - ĐÃ SỬA
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
  // 📋 LOAD CONVERSATIONS - ĐÃ SỬA
  // ========================
  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      console.log('📋 Loaded conversations:', data.conversations.length);
      setConversations(data.conversations);

      let targetConversation = null;
      
      // Ưu tiên conversation được chỉ định
      if (initialConversationId) {
        targetConversation = data.conversations.find((c) => c._id === initialConversationId);
        console.log('🎯 Found initial conversation:', targetConversation?._id);
      }
      
      // Sau đó ưu tiên course conversation
      if (!targetConversation && courseConversation) {
        targetConversation = courseConversation;
        console.log('🎯 Using course conversation:', targetConversation?._id);
      }
      
      // Cuối cùng chọn conversation đầu tiên
      if (!targetConversation && data.conversations.length > 0) {
        targetConversation = data.conversations[0];
        console.log('🎯 Using first conversation:', targetConversation?._id);
      }

      if (targetConversation) {
        setSelectedConversation(targetConversation);
        currentConversationIdRef.current = targetConversation._id;
        loadMessages(targetConversation._id);
      } else {
        console.log('ℹ️ No conversation to select');
      }
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      console.error('Error details:', err.response?.data || err.message);
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
      console.error('Error details:', err.response?.data || err.message);
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
      console.error('Error details:', err.response?.data || err.message);
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
      console.error('Error details:', err.response?.data || err.message);
      setError('Không thể tạo hội thoại mới.');
    }
  };

  // ========================
  // EFFECTS - ĐÃ SỬA
  // ========================
  
  // Initial load
  useEffect(() => {
    console.log('🚀 ChatContainer mounted');
    console.log('📌 Props - courseId:', courseId, 'courseName:', courseName);
    
    loadConversations();
    
    // ✅ Khởi tạo course chat nếu có courseId
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
  // RENDER - ĐÃ SỬA
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
            
            {/* ✅ HIỂN THỊ NÚT KHỞI TẠO KHI CÓ COURSEID */}
            {courseId && (
              <div className={styles.courseActions}>
                <p>Khóa học: <strong>{courseName || courseId}</strong></p>
                <button 
                  onClick={() => initializeCourseChat(courseId)}
                  className={styles.initializeCourseChatButton}
                >
                  {courseConversation ? 'Tải lại thảo luận' : 'Khởi tạo thảo luận khóa học'}
                </button>
                
                {/* ✅ HIỂN THỊ THÔNG TIN INSTRUCTORS */}
                {courseInstructors.length > 0 && (
                  <div className={styles.instructorsPreview}>
                    <p>Giảng viên có sẵn: {courseInstructors.length}</p>
                    <button 
                      onClick={() => setActiveTab('instructors')}
                      className={styles.viewInstructorsButton}
                    >
                      Xem danh sách giảng viên
                    </button>
                  </div>
                )}
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