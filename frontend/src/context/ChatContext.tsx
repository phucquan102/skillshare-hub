import React, { createContext, useContext, useState } from 'react';
import apiConfig from '../services/api/apiConfig';

interface ChatContextType {
  aiConversationId: string | null;
  loadingConversation: boolean;
  initConversation: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({
  aiConversationId: null,
  loadingConversation: false,
  initConversation: async () => {},
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aiConversationId, setAiConversationId] = useState<string | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);

  // ✅ Hàm chỉ gọi khi người dùng click “Ask AI”
  const initConversation = async () => {
    if (aiConversationId || loadingConversation) return;
    try {
      setLoadingConversation(true);
      const res = await apiConfig.get('/chat/ai/conversation/init');
      setAiConversationId(res.data.conversationId);
      console.log('✅ Conversation initialized:', res.data.conversationId);
    } catch (err) {
      console.error('❌ initConversation error:', err);
    } finally {
      setLoadingConversation(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        aiConversationId,
        loadingConversation,
        initConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => useContext(ChatContext);
