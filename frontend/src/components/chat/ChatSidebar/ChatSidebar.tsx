import React, { useState } from 'react';
import { Conversation, User } from './../../../types/chat.types';
import { ConversationList } from '../ConversationList/ConversationList';
import styles from './ChatSidebar.module.scss';

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onStartNewConversation: (participantId: string) => void;
  currentUser: User | null;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  onStartNewConversation,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const filteredConversations = conversations.filter(conv => {
    if (conv.type === 'direct') {
      const otherParticipant = conv.participants.find(p => p.userId !== currentUser?._id);
      return otherParticipant?.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return conv.title?.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  return (
    <div className={styles.chatSidebar}>
      <div className={styles.sidebarHeader}>
        <h2>Messages</h2>
        <button 
          className={styles.newChatButton}
          onClick={() => setShowNewChat(true)}
        >
          + New Chat
        </button>
      </div>

      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.conversationSection}>
        <ConversationList
          conversations={filteredConversations}
          selectedConversation={selectedConversation}
          onSelectConversation={onSelectConversation}
          currentUser={currentUser}
        />
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onStartConversation={onStartNewConversation}
        />
      )}
    </div>
  );
};

// Simple modal for new chat (you can enhance this later)
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>Start New Chat</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={styles.userIdInput}
          />
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Start Chat</button>
          </div>
        </form>
      </div>
    </div>
  );
};