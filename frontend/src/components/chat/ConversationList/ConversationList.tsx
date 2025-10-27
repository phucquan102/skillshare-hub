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
  currentUser
}) => {
  const getConversationName = (conversation: Conversation): string => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.userId !== currentUser?._id);
      return otherParticipant?.user?.fullName || 'Unknown User';
    }
    return conversation.title || 'Group Chat';
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
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.conversationList}>
      {conversations.length === 0 ? (
        <div className={styles.emptyState}>
          No conversations yet. Start a new chat!
        </div>
      ) : (
        conversations.map(conversation => (
          <div
            key={conversation._id}
            className={`${styles.conversationItem} ${
              selectedConversation?._id === conversation._id ? styles.selected : ''
            }`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className={styles.avatar}>
              {getConversationName(conversation).charAt(0).toUpperCase()}
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