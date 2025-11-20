import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from './../../../types/chat.types';
import { chatService } from './../../../services/api/chatService';
import { ChatSidebar } from '../ChatSidebar/ChatSidebar';
import { MessageList } from '../MessageList/MessageList';
import { MessageInput } from '../MessageInput/MessageInput';
import { useAuth } from './../../../context/AuthContext';
import { socket } from "../../../utils/socket";
import { 
  FiMessageSquare, 
  FiUsers, 
  FiBook,
  FiRefreshCw,
  FiAlertCircle,
  FiArrowLeft,
  FiUser,
  FiCheck
} from 'react-icons/fi';
import { HiOutlineAcademicCap, HiOutlineSparkles } from 'react-icons/hi';

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

  // Load course instructors
  const loadCourseInstructors = async (courseId: string) => {
    try {
      console.log('👨‍🏫 Loading instructors for course:', courseId);
      setInstructorLoading(true);
      
      const response = await chatService.getCourseInstructors(courseId);
      
      let instructors = [];
      
      if (response?.instructors && Array.isArray(response.instructors)) {
        instructors = response.instructors;
      } else if (Array.isArray(response)) {
        instructors = response;
      } else if ((response as any)?.data && Array.isArray((response as any).data)) {
        instructors = (response as any).data;
      }
      
      console.log('✅ Final extracted instructors:', instructors);
      setCourseInstructors(instructors);
      return instructors;
    } catch (error: any) {
      console.error('❌ Failed to load instructors:', error);
      setCourseInstructors([]);
      return [];
    } finally {
      setInstructorLoading(false);
    }
  };

  // Initialize course chat
  const initializeCourseChat = async (courseId: string) => {
    try {
      console.log('🔄 Initializing course chat for:', courseId);
      
      const instructors = await loadCourseInstructors(courseId);
      console.log('✅ Instructors loaded:', instructors.length);
      
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
        await loadConversations();
        
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

  // Start 1-1 chat with instructor
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

  // Select course group conversation
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

  // Load conversations
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

  // Load messages
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

  // Send message
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

  // Select conversation
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

  // Start new conversation
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

  // Effects
  useEffect(() => {
    console.log('🚀 ChatContainer mounted');
    console.log('📌 Props - courseId:', courseId, 'courseName:', courseName);
    
    loadConversations();
    
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

  // Loading state
  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Đang tải hội thoại...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200/60 bg-gradient-to-b from-emerald-50 to-green-50 flex-shrink-0">
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

      {/* Chat Area - FIXED: Thêm min-w-0 và flex-col */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            {/* Chat Header - FIXED: Thêm flex-shrink-0 */}
            <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200/60 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                    <FiMessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {selectedConversation.type === 'direct'
                        ? selectedConversation.participants.find((p) => p.userId !== user?._id)?.user?.fullName ||
                          'Người dùng'
                        : selectedConversation.title || 'Thảo luận nhóm'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        {selectedConversation.type === 'direct' ? (
                          <>
                            <FiUser className="w-3 h-3" />
                            Tin nhắn riêng
                          </>
                        ) : (
                          <>
                            <FiUsers className="w-3 h-3" />
                            Thảo luận nhóm
                          </>
                        )}
                      </span>
                      {selectedConversation._id === courseConversation?._id && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-emerald-600">
                            <FiBook className="w-3 h-3" />
                            Thảo luận khóa học
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation._id === courseConversation?._id && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                      Course Chat
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Container - FIXED: Thêm min-h-0 và flex-1 */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-white to-emerald-50/30">
              <MessageList messages={messages} currentUserId={user?._id || ''} />
            </div>
            
            {/* Message Input - FIXED: Thêm flex-shrink-0 */}
            <div className="border-t border-gray-200/60 bg-white/80 backdrop-blur-sm flex-shrink-0">
              <MessageInput onSendMessage={handleSendMessage} disabled={!selectedConversation} />
            </div>
          </>
        ) : (
          /* No Conversation Selected - FIXED: Thêm min-h-0 */
          <div className="flex-1 min-h-0 flex items-center justify-center bg-gradient-to-br from-white to-emerald-50/50 p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <HiOutlineSparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent mb-3">
                Chào mừng đến với Thảo luận
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Chọn một hội thoại hoặc bắt đầu cuộc trò chuyện mới
              </p>
              
              {courseId && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-100 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <FiBook className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Khóa học hiện tại</p>
                      <p className="font-bold text-gray-900">{courseName || courseId}</p>
                    </div>
                  </div>

                  {/* Instructors Loading */}
                  {instructorLoading ? (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-600">Đang tải danh sách giảng viên...</span>
                    </div>
                  ) : courseInstructors.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <HiOutlineAcademicCap className="w-4 h-4" />
                        <span>Giảng viên có sẵn: <strong>{courseInstructors.length}</strong></span>
                      </div>
                      
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {courseInstructors.slice(0, 3).map(instructor => (
                          <div key={instructor._id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                <FiUser className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-medium text-gray-900">{instructor.fullName}</span>
                            </div>
                            <button 
                              onClick={() => handleStartInstructorConversation(instructor._id)}
                              className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-all duration-200 font-medium flex items-center gap-2"
                            >
                              <FiMessageSquare className="w-3 h-3" />
                              Chat
                            </button>
                          </div>
                        ))}
                      </div>

                      {courseInstructors.length > 3 && (
                        <button 
                          onClick={() => setActiveTab('instructors')}
                          className="w-full py-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center justify-center gap-2 hover:bg-emerald-50 rounded-xl transition-all duration-200"
                        >
                          Xem thêm {courseInstructors.length - 3} giảng viên
                          <FiArrowLeft className="w-4 h-4 transform rotate-180" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <FiUsers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Chưa có giảng viên nào trong khóa học này</p>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => initializeCourseChat(courseId)}
                    className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-semibold flex items-center justify-center gap-3"
                  >
                    {courseConversation ? (
                      <>
                        <FiRefreshCw className="w-4 h-4" />
                        Tải lại thảo luận
                      </>
                    ) : (
                      <>
                        <HiOutlineSparkles className="w-4 h-4" />
                        Khởi tạo thảo luận
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm flex items-center gap-4 max-w-md">
            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium">{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="text-red-600 hover:text-red-800 hover:scale-110 transition-all duration-200"
            >
              <FiCheck className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};