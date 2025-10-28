import React, { useState, useEffect } from 'react';
import { Conversation, User } from './../../../types/chat.types';
import { ConversationList } from '../ConversationList/ConversationList';
import styles from './ChatSidebar.module.scss';

// Define InstructorListProps for the InstructorList component
interface InstructorListProps {
  instructors: any[];
  onStartInstructorConversation: (instructorId: string) => void;
  currentUser: User | null;
}

// Define ChatSidebarProps with all required props
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

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => {
    if (conv.type === 'direct') {
      const otherParticipant = conv.participants.find(p => p.userId !== currentUser?._id);
      return otherParticipant?.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return conv.title?.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  // Automatically start conversations with instructors on enrollment
  useEffect(() => {
    if (isNewlyEnrolled && courseId && courseInstructors.length > 0 && onStartInstructorConversation) {
      courseInstructors.forEach(instructor => {
        const existingConversation = conversations.find(conv =>
          conv.type === 'direct' &&
          conv.participants.some(p => p.userId === instructor._id)
        );
        if (!existingConversation) {
          onStartInstructorConversation(instructor._id);
        }
      });
    }
  }, [isNewlyEnrolled, courseId, courseInstructors, onStartInstructorConversation, conversations]);

  return (
    <div className={styles.chatSidebar}>
      {/* Header with tabs */}
      <div className={styles.sidebarHeader}>
        <h2>Tin nhắn</h2>
        {courseId && (
          <div className={styles.tabContainer}>
            <button
              className={`${styles.tab} ${activeTab === 'chats' ? styles.active : ''}`}
              onClick={() => setActiveTab('chats')}
            >
              💬 Hội thoại
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'instructors' ? styles.active : ''}`}
              onClick={() => setActiveTab('instructors')}
            >
              👨‍🏫 Giảng viên
            </button>
          </div>
        )}
        <button
          className={styles.newChatButton}
          onClick={() => setShowNewChat(true)}
        >
          + Chat mới
        </button>
      </div>

      {/* Course Group Chat Section */}
      {courseId && courseConversation && (
        <div className={styles.courseSection}>
          <h3 className={styles.sectionTitle}>Thảo luận khóa học</h3>
          <div
            className={`${styles.courseConversationItem} ${
              selectedConversation?._id === courseConversation._id ? styles.selected : ''
            }`}
            onClick={onSelectCourseConversation}
          >
            <div className={styles.courseAvatar}>👥</div>
            <div className={styles.courseInfo}>
              <div className={styles.courseName}>
                {courseConversation.title || 'Thảo luận chung'}
              </div>
              <div className={styles.courseDescription}>
                Trò chuyện với tất cả mọi người trong khóa học
              </div>
              <div className={styles.courseBadge}>Nhóm</div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      <div className={styles.sidebarContent}>
        {activeTab === 'chats' ? (
          <>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Tìm kiếm hội thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.conversationSection}>
              <h3 className={styles.sectionTitle}>Hội thoại khác</h3>
              <ConversationList
                conversations={filteredConversations}
                selectedConversation={selectedConversation}
                onSelectConversation={onSelectConversation}
                currentUser={currentUser}
              />
            </div>
          </>
        ) : (
          <InstructorList
            instructors={courseInstructors}
            onStartInstructorConversation={onStartInstructorConversation || (() => {})}
            currentUser={currentUser}
          />
        )}
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

// InstructorList Component
const InstructorList: React.FC<InstructorListProps> = ({
  instructors,
  onStartInstructorConversation,
  currentUser,
}) => {
  if (instructors.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>👨‍🏫</div>
        <p>Chưa có giảng viên nào</p>
      </div>
    );
  }

  return (
    <div className={styles.instructorList}>
      <div className={styles.sectionHeader}>
        <h3>Giảng viên khóa học</h3>
        <span className={styles.count}>{instructors.length}</span>
      </div>
      {instructors.map(instructor => (
        <div
          key={instructor._id}
          className={styles.instructorItem}
          onClick={() => onStartInstructorConversation(instructor._id)}
        >
          <div className={styles.instructorAvatar}>
            {instructor.profile?.avatar ? (
              <img src={instructor.profile.avatar} alt={instructor.fullName} />
            ) : (
              <span>{instructor.fullName?.charAt(0).toUpperCase() || 'G'}</span>
            )}
          </div>
          <div className={styles.instructorInfo}>
            <div className={styles.instructorName}>
              {instructor.fullName || 'Giảng viên'}
            </div>
            <div className={styles.instructorRole}>👨‍🏫 Giảng viên</div>
            {instructor.profile?.bio && (
              <div className={styles.instructorBio}>{instructor.profile.bio}</div>
            )}
          </div>
          <div className={styles.chatButton}>
            <span>💬</span>
          </div>
        </div>
      ))}
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>Bắt đầu chat mới</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nhập ID người dùng"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={styles.userIdInput}
          />
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose}>Hủy</button>
            <button type="submit">Bắt đầu</button>
          </div>
        </form>
      </div>
    </div>
  );
};