import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from './../../../types/chat.types';
import { chatService } from './../../../services/api/chatService';
import { ChatSidebar } from '../ChatSidebar/ChatSidebar';
import { MessageList } from '../MessageList/MessageList';
import { MessageInput } from '../MessageInput/MessageInput';
import styles from './ChatContainer.module.scss';
import { useAuth } from './../../../context/AuthContext';
import { socket } from "../../../utils/socket";

interface ChatContainerProps {
  initialConversationId?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ initialConversationId }) => {
  const { user } = useAuth();
  
  // 🔍 LOG NGAY TẠI ĐÂY
  console.log('🎯 ChatContainer render - user:', user);
  console.log('🎯 ChatContainer render - user._id:', user?._id);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentConversationIdRef = useRef<string | null>(null);

  // Load danh sách hội thoại
  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      setConversations(data.conversations);

      if (data.conversations.length > 0) {
        const targetConversation =
          initialConversationId
            ? data.conversations.find((c) => c._id === initialConversationId)
            : data.conversations[0];
        if (targetConversation) {
          setSelectedConversation(targetConversation);
          currentConversationIdRef.current = targetConversation._id;
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Load tin nhắn
  const loadMessages = async (conversationId: string) => {
    try {
      const data = await chatService.getMessages(conversationId);
      setMessages(data.messages);
      await chatService.markAsRead(conversationId);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    }
  };

  // Gửi tin nhắn
  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;
    try {
      const { data: newMessage } = await chatService.sendMessage({
        conversationId: selectedConversation._id,
        content,
      });

      setMessages((prev) => [...prev, newMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  // Khi chọn cuộc hội thoại
  const handleSelectConversation = (conversation: Conversation) => {
    if (currentConversationIdRef.current) {
      socket.emit("leave_conversation", currentConversationIdRef.current);
    }
    
    setSelectedConversation(conversation);
    currentConversationIdRef.current = conversation._id;
    setError(null);
    loadMessages(conversation._id);
  };

  // Tạo cuộc trò chuyện mới
  const handleStartNewConversation = async (participantId: string) => {
    try {
      const conversation = await chatService.findOrCreateDirectConversation(participantId);
      
      if (currentConversationIdRef.current) {
        socket.emit("leave_conversation", currentConversationIdRef.current);
      }
      
      setSelectedConversation(conversation);
      currentConversationIdRef.current = conversation._id;
      await loadConversations();
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError('Failed to start conversation');
    }
  };

  // Load hội thoại lần đầu
  useEffect(() => {
    loadConversations();
    
    return () => {
      if (currentConversationIdRef.current) {
        socket.emit("leave_conversation", currentConversationIdRef.current);
      }
    };
  }, []);

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
            console.log('Duplicate message detected, skipping');
            return prev;
          }
          console.log('Adding new message to state');
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

  if (loading && conversations.length === 0) {
    return <div className={styles.loading}>Loading conversations...</div>;
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.sidebar}>
        <ChatSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          onStartNewConversation={handleStartNewConversation}
          currentUser={user}
        />
      </div>

      <div className={styles.chatArea}>
        {selectedConversation ? (
          <>
            <div className={styles.chatHeader}>
              <h3>
                {selectedConversation.type === 'direct'
                  ? selectedConversation.participants.find((p) => p.userId !== user?._id)?.user?.fullName ||
                    'Unknown User'
                  : selectedConversation.title || 'Group Chat'}
              </h3>
              <span className={styles.chatInfo}>
                {selectedConversation.type === 'direct' ? 'Direct Message' : 'Group Chat'}
              </span>
            </div>

            <div className={styles.messagesContainer}>
              <MessageList messages={messages} currentUserId={user?._id || ''} />
            </div>
            
            <MessageInput onSendMessage={handleSendMessage} disabled={!selectedConversation} />
          </>
        ) : (
          <div className={styles.noConversation}>
            <h3>Welcome to Chat</h3>
            <p>Select a conversation or start a new one to begin messaging</p>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
};