// components/chat/ConversationList/ConversationList.tsx - ĐÃ SỬA
import React from 'react';
import { Conversation, User } from './../../../types/chat.types';
import styles from './ConversationList.module.scss';

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
      
      // ✅ Thêm biểu tượng instructor nếu có
      if (otherParticipant?.role === 'instructor') {
        return `👨‍🏫 ${name}`;
      }
      return name;
    }
    return conversation.title || 'Group Chat';
  };

  const getConversationIcon = (conversation: Conversation): string => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.userId !== currentUser?._id
      );
      return otherParticipant?.role === 'instructor' ? '👨‍🏫' : '👤';
    }
    return '👥';
  };

  const getLastMessagePreview = (conversation: Conversation): string => {
    if (!conversation.lastMessage) return 'Chưa có tin nhắn';
    return conversation.lastMessage.content.length > 50
      ? conversation.lastMessage.content.substring(0, 50) + '...'
      : conversation.lastMessage.content;
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} giờ trước`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className={styles.conversationList}>
      {conversations.length === 0 ? (
        <div className={styles.emptyState}>
          Chưa có hội thoại nào. Bắt đầu trò chuyện với giảng viên hoặc bạn học!
        </div>
      ) : (
        conversations.map(conversation => (
          <div
            key={conversation._id}
            className={`${styles.conversationItem} ${
              selectedConversation?._id === conversation._id ? styles.selected : ''
            } ${conversation.type === 'direct' ? styles.direct : styles.group}`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className={styles.conversationIcon}>
              {getConversationIcon(conversation)}
            </div>
            
            <div className={styles.conversationInfo}>
              <div className={styles.conversationHeader}>
                <span className={styles.conversationName}>
                  {getConversationName(conversation)}
                </span>
                {conversation.lastMessage && (
                  <span className={styles.timestamp}>
                    {getTimeAgo(conversation.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              
              <div className={styles.conversationPreview}>
                <span className={styles.lastMessage}>
                  {getLastMessagePreview(conversation)}
                </span>
                {conversation.unreadCount > 0 && (
                  <span className={styles.unreadBadge}>
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};