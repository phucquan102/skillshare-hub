import React from 'react';
import { useParams } from 'react-router-dom'; // hoặc từ source khác
import { ChatContainer } from '../../../components/chat/ChatContainer/ChatContainer';
import styles from './ChatPage.module.scss';

export const ChatPage: React.FC = () => {
  // Lấy courseId từ URL params (nếu có)
  const { courseId } = useParams<{ courseId?: string }>();
  
  // Hoặc nếu bạn muốn hard-code course để test:
  // const courseId = 'test-course-id';
  // const courseName = 'Test Course';

  return (
    <div className={styles.chatPage}>
      <div className={styles.pageHeader}>
        <h1>Messages</h1>
        <p>Chat with students and instructors</p>
      </div>
      <div className={styles.chatContent}>
        <ChatContainer 
          courseId={courseId}
          courseName={courseId ? `Course ${courseId}` : undefined}
        />
      </div>
    </div>
  );
};