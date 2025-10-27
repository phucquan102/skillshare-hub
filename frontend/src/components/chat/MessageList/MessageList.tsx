import React, { useEffect, useRef } from 'react';
import { Message } from './../../../types/chat.types';
import styles from './MessageList.module.scss';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 🔍 DEBUG: Log currentUserId khi component mount hoặc thay đổi
  useEffect(() => {
    console.log('===== MessageList Props =====');
    console.log('currentUserId:', currentUserId);
    console.log('currentUserId type:', typeof currentUserId);
    console.log('currentUserId length:', currentUserId.length);
    console.log('currentUserId empty?:', currentUserId === '');
  }, [currentUserId]);

  const isOwnMessage = (message: Message): boolean => {
    const senderId = typeof message.senderId === 'string'
      ? message.senderId
      : message.senderId?._id;

    const isOwn = senderId === currentUserId;

    // 🔍 Chi tiết debug
    console.log('------- Message Check -------');
    console.log('senderId:', senderId);
    console.log('senderId type:', typeof senderId);
    console.log('currentUserId:', currentUserId);
    console.log('Match?:', isOwn);
    console.log('Content:', message.content.substring(0, 30));
    console.log('Full message object:', message);
    console.log('----------------------------');

    return isOwn;
  };

  const getSenderName = (message: Message): string => {
    if (typeof message.senderId === 'string') return 'Unknown User';
    return message.senderId?.fullName || 'Unknown User';
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const uniqueMessages = messages.reduce((acc: Message[], msg) => {
    if (!acc.find((m) => m._id === msg._id)) {
      acc.push(msg);
    }
    return acc;
  }, []);

  return (
    <div className={styles.messageList}>
      {uniqueMessages.length === 0 ? (
        <div className={styles.emptyState}>No messages yet. Start chatting!</div>
      ) : (
        uniqueMessages.map((message) => {
          const own = isOwnMessage(message);
          return (
            <div
              key={message._id}
              className={`${styles.messageItem} ${own ? styles.ownMessage : styles.otherMessage}`}
            >
              {!own && (
                <div className={styles.senderName}>
                  {getSenderName(message)}
                </div>
              )}
              <div className={styles.messageContent}>
                <div className={styles.bubble}>
                  <div className={styles.text}>{message.content}</div>
                  <div className={`${styles.time} ${own ? styles.ownTime : styles.otherTime}`}>
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};