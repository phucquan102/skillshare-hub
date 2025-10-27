import React from 'react';
import { ChatContainer } from '../../../components/chat/ChatContainer/ChatContainer';
import styles from './ChatPage.module.scss';

export const ChatPage: React.FC = () => {
  return (
    <div className={styles.chatPage}>
      <div className={styles.pageHeader}>
        <h1>Messages</h1>
        <p>Chat with students and instructors</p>
      </div>
      
      <div className={styles.chatContent}>
        <ChatContainer />
      </div>
    </div>
  );
};