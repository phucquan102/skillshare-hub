import React, { useState, useEffect } from 'react';
import { Conversation, User } from './../../../types/chat.types';
import { ConversationList } from '../ConversationList/ConversationList';
import { FiSearch, FiPlus, FiX, FiUsers, FiMessageSquare } from 'react-icons/fi';

interface InstructorListProps {
  instructors: any[];
  onStartInstructorConversation: (instructorId: string) => void;
  currentUser: User | null;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onStartNewConversation: (participantId: string) => void;
  currentUser: User | null;
  courseId?: string;
  courseInstructors?: any[];
  courseConversation?: Conversation | null;
  onStartInstructorConversation?: (instructorId: string) => void;
  onSelectCourseConversation?: () => void;
  isNewlyEnrolled?: boolean;
  activeTab: 'chats' | 'instructors';
  setActiveTab: (tab: 'chats' | 'instructors') => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  onStartNewConversation,
  currentUser,
  courseId,
  courseInstructors = [],
  courseConversation,
  onStartInstructorConversation,
  onSelectCourseConversation,
  isNewlyEnrolled = false,
  activeTab,
  setActiveTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  // Debug logs
  useEffect(() => {
    console.log('📊 ChatSidebar Debug:', {
      courseId,
      courseInstructors,
      courseInstructorsLength: courseInstructors?.length,
      activeTab,
      hasCourseConversation: !!courseConversation,
    });
  }, [courseId, courseInstructors, activeTab, courseConversation]);

  const filteredConversations = conversations.filter(conv => {
    if (conv.type === 'direct') {
      const otherParticipant = conv.participants.find(p => p.userId !== currentUser?._id);
      return otherParticipant?.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return conv.title?.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  return (
    <div className="w-full bg-white/80 backdrop-blur-xl border-r border-gray-200/60 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-200/60 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
            Messages
          </h1>
          <button
            onClick={() => setShowNewChat(true)}
            className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs - Show only if courseId exists */}
        {courseId && courseInstructors && courseInstructors.length > 0 && (
          <div className="flex bg-gray-100/80 rounded-2xl p-1 backdrop-blur-sm">
            <button
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'chats'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('chats')}
            >
              <FiMessageSquare className="w-4 h-4" />
              Conversations
            </button>
            <button
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'instructors'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('instructors')}
            >
              <FiUsers className="w-4 h-4" />
              Instructors ({courseInstructors.length})
            </button>
          </div>
        )}
      </div>

      {/* Course Group Chat */}
      {courseId && courseConversation && (
        <div className="p-4 border-b border-gray-200/60 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 px-2">Course Discussion</h3>
          <div
            className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 group ${
              selectedConversation?._id === courseConversation._id
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg'
                : 'bg-white/90 backdrop-blur-sm border border-gray-200/60 hover:shadow-md'
            }`}
            onClick={onSelectCourseConversation}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg ${
                selectedConversation?._id === courseConversation._id
                  ? 'bg-white/20'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}>
                👥
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold truncate ${
                  selectedConversation?._id === courseConversation._id ? 'text-white' : 'text-gray-900'
                }`}>
                  {courseConversation.title || 'Course Discussion'}
                </h4>
                <p className={`text-sm truncate ${
                  selectedConversation?._id === courseConversation._id ? 'text-white/80' : 'text-gray-600'
                }`}>
                  Chat with everyone in the course
                </p>
                <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block mt-1 ${
                  selectedConversation?._id === courseConversation._id
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  Group
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'chats' ? (
          <>
            {/* Search */}
            <div className="p-4 border-b border-gray-200/60 flex-shrink-0">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300 text-sm"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="h-full min-h-0 overflow-y-auto">
              <div className="p-2">
                <ConversationList
                  conversations={filteredConversations}
                  selectedConversation={selectedConversation}
                  onSelectConversation={onSelectConversation}
                  currentUser={currentUser}
                />
              </div>
            </div>
          </>
        ) : (
          <InstructorList
            instructors={courseInstructors || []}
            onStartInstructorConversation={onStartInstructorConversation || (() => {})}
            currentUser={currentUser}
          />
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onStartConversation={onStartNewConversation}
        />
      )}
    </div>
  );
};

// InstructorList Component
const InstructorList: React.FC<InstructorListProps> = ({
  instructors,
  onStartInstructorConversation,
  currentUser,
}) => {
  useEffect(() => {
    console.log('👨‍🏫 InstructorList Debug:', {
      instructorsLength: instructors?.length,
      instructors,
    });
  }, [instructors]);

  if (!instructors || instructors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-6 h-full">
        <div className="w-20 h-20 bg-gradient-to-r from-emerald-100 to-green-100 rounded-3xl flex items-center justify-center mb-4">
          <FiUsers className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Instructors</h3>
        <p className="text-gray-500 text-sm">
          No instructors available for this course
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 h-full min-h-0 overflow-y-auto">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/80 py-2">
        <h3 className="text-sm font-semibold text-gray-700">Course Instructors</h3>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
          {instructors.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {instructors.map(instructor => (
          <div
            key={instructor._id}
            className="group p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 hover:shadow-md hover:border-emerald-200 transition-all duration-300 cursor-pointer"
            onClick={() => {
              console.log('🔄 Starting conversation with instructor:', instructor._id);
              onStartInstructorConversation(instructor._id);
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center text-white font-semibold shadow-lg flex-shrink-0">
                {instructor.profile?.avatar ? (
                  <img 
                    src={instructor.profile.avatar} 
                    alt={instructor.fullName}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  instructor.fullName?.charAt(0).toUpperCase() || 'I'
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {instructor.fullName || 'Instructor'}
                  </h4>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium whitespace-nowrap">
                    👨‍🏫 Instructor
                  </span>
                </div>
                
                {instructor.profile?.bio && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {instructor.profile.bio}
                  </p>
                )}
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
                <div className="p-2 bg-emerald-500 text-white rounded-xl hover:shadow-lg transform group-hover:scale-105 transition-all duration-300">
                  <FiMessageSquare className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// NewChatModal Component
const NewChatModal: React.FC<{
  onClose: () => void;
  onStartConversation: (participantId: string) => void;
}> = ({ onClose, onStartConversation }) => {
  const [userId, setUserId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim()) {
      onStartConversation(userId.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Start New Chat</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              placeholder="Enter user ID to start chatting..."
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all duration-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!userId.trim()}
              className={`flex-1 px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                userId.trim()
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Start Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};