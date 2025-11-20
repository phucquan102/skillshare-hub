import React from 'react';
import { Conversation, User } from './../../../types/chat.types';
import { FiMessageSquare, FiUsers, FiCheck } from 'react-icons/fi';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  currentUser: User | null;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUser,
}) => {
    const getConversationName = (conversation: Conversation): string => {
      if (conversation.type === 'direct') {
        const otherParticipant = conversation.participants.find(
          p => p.userId !== currentUser?._id
        );
        const name = otherParticipant?.user?.fullName || 'Unknown User';
        
        if (otherParticipant?.role === 'instructor') {
          return `👨‍🏫 ${name}`;
        }
        return name;
      }
      return conversation.title || 'Group Chat';
    };

  const getConversationIcon = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.userId !== currentUser?._id
      );
      return otherParticipant?.role === 'instructor' ? '👨‍🏫' : '👤';
    }
    return '👥';
  };

  const getLastMessagePreview = (conversation: Conversation): string => {
    if (!conversation.lastMessage) return 'No messages yet';
    return conversation.lastMessage.content.length > 50
      ? conversation.lastMessage.content.substring(0, 50) + '...'
      : conversation.lastMessage.content;
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString('en-US');
  };

  const getParticipantAvatar = (conversation: Conversation): string => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.userId !== currentUser?._id
      );
      return otherParticipant?.user?.profile?.avatar || '';
    }
    return '';
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-emerald-100 to-green-100 rounded-3xl flex items-center justify-center mb-4">
          <FiMessageSquare className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No conversations</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Start a new conversation with instructors or classmates
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {conversations.map(conversation => (
        <div
          key={conversation._id}
          className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
            selectedConversation?._id === conversation._id
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg transform scale-[1.02]'
              : 'bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200/60'
          }`}
          onClick={() => onSelectConversation(conversation)}
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-white font-semibold shadow-lg ${
              selectedConversation?._id === conversation._id
                ? 'bg-white/20'
                : conversation.type === 'direct'
                ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            }`}>
              {getParticipantAvatar(conversation) ? (
                <img 
                  src={getParticipantAvatar(conversation)} 
                  alt={getConversationName(conversation)}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span className="text-lg">{getConversationIcon(conversation)}</span>
              )}
            </div>

            {/* Conversation Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-semibold truncate ${
                  selectedConversation?._id === conversation._id ? 'text-white' : 'text-gray-900'
                }`}>
                  {getConversationName(conversation)}
                </h3>
                {conversation.lastMessage && (
                  <span className={`text-xs ${
                    selectedConversation?._id === conversation._id ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {getTimeAgo(conversation.lastMessage.createdAt)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className={`text-sm truncate ${
                  selectedConversation?._id === conversation._id ? 'text-white/90' : 'text-gray-600'
                }`}>
                  {getLastMessagePreview(conversation)}
                </p>
                
                <div className="flex items-center gap-2">
                  {conversation.unreadCount > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedConversation?._id === conversation._id
                        ? 'bg-white text-emerald-600'
                        : 'bg-emerald-500 text-white'
                    }`}>
                      {conversation.unreadCount}
                    </span>
                  )}
                  {selectedConversation?._id === conversation._id && (
                    <FiCheck className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>

              {/* Conversation Type Badge */}
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedConversation?._id === conversation._id
                    ? 'bg-white/20 text-white'
                    : conversation.type === 'direct'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {conversation.type === 'direct' ? 'Direct' : 'Group'}
                </span>
                {conversation.courseId && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedConversation?._id === conversation._id
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    Course
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};