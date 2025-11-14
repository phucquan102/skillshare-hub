// frontend/src/components/chat/AIChatComponent.tsx
import React, { useState, useRef, useEffect } from 'react';
import styles from './AIChatComponent.module.scss';
import apiConfig from '../../services/api/apiConfig';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  courses?: Array<{ id: string; title: string; category: string }>;
  timestamp: Date;
}

interface AIChatComponentProps {
  conversationId?: string;
}

export const AIChatComponent: React.FC<AIChatComponentProps> = ({ conversationId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
    
  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Send message to AI
   */
  const sendMessageToAI = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    try {
      setLoading(true);

      // 1. Show user message
      const userMessage: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text: textToSend,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      // 2. Send API request
      const response = await apiConfig.post('/chat/ai/chat', {
        content: textToSend,
        conversationId: conversationId ?? null
      });

      // 3. Show AI response
      const aiMessage: Message = {
        id: response.data.aiMessage.id,
        sender: 'ai',
        text: response.data.aiMessage.content,
        courses: response.data.aiMessage.courses,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('❌ Error:', error);
      alert('Error occurred. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    sendMessageToAI(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAsk = (text: string) => {
    sendMessageToAI(text);
  };

  const handleCourseClick = (courseId: string) => {
    window.location.href = `/courses/${courseId}`;
  };

  return (
    <div className={styles.aiChatContainer}>
      {/* NO HEADER - Keep it minimal */}

      {/* Messages Area */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emoji}>💡</div>
            <p>Try asking something like:</p>
            <ul className={styles.suggestions}>
              <li
                className={styles.suggestionItem}
                onClick={() => handleQuickAsk('I want to learn Python')}
              >
                👉 "I want to learn Python"
              </li>

              <li
                className={styles.suggestionItem}
                onClick={() => handleQuickAsk('Web Development courses for beginners')}
              >
                👉 "Web Development for beginners"
              </li>

              <li
                className={styles.suggestionItem}
                onClick={() => handleQuickAsk('AI and Machine Learning courses')}
              >
                👉 "AI and Machine Learning"
              </li>

              <li
                className={styles.suggestionItem}
                onClick={() => handleQuickAsk('Courses under $50')}
              >
                👉 "Courses under $50"
              </li>
            </ul>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`${styles.message} ${styles[msg.sender]}`}>
              {/* Avatar */}
              <div className={styles.avatar}>
                {msg.sender === 'user' ? '👤' : '🤖'}
              </div>

              {/* Message Content */}
              <div className={styles.content}>
                <div className={styles.text}>
                  {msg.text}
                </div>

                {/* Recommended Courses */}
                {msg.courses && msg.courses.length > 0 && (
                  <div className={styles.coursesSection}>
                    <h4>📚 Recommended Courses:</h4>
                    <div className={styles.coursesList}>
                      {msg.courses.map(course => (
                        <div
                          key={course.id}
                          className={styles.courseCard}
                          onClick={() => handleCourseClick(course.id)}
                        >
                          <div className={styles.courseTitle}>{course.title}</div>
                          <div className={styles.courseCategory}>{course.category}</div>
                          <button className={styles.viewBtn}>View Details →</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <span className={styles.timestamp}>
                  {msg.timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className={`${styles.message} ${styles.ai}`}>
            <div className={styles.avatar}>🤖</div>
            <div className={styles.content}>
              <div className={styles.typing}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={styles.inputSection}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What do you want to learn? E.g: Python, Web Design..."
            disabled={loading}
            className={styles.input}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className={styles.sendBtn}
          >
            {loading ? '⏳' : '📤'}
          </button>
        </div>
        <p className={styles.hint}>Tip: Be specific about the topic you want to learn</p>
      </div>
    </div>
  );
};

export default AIChatComponent;