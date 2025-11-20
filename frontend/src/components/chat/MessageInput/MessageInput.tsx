import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiSmile } from 'react-icons/fi';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className="border-t border-gray-200/60 bg-white/80 backdrop-blur-sm p-6">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-3 bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-gray-200/60 focus-within:border-emerald-500/50 focus-within:shadow-lg transition-all duration-300 p-3">
          {/* Attachment Button */}
          <button
            type="button"
            disabled={disabled}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiPaperclip className="w-5 h-5" />
          </button>

          {/* Emoji Button */}
          <button
            type="button"
            disabled={disabled}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSmile className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={disabled}
              rows={1}
              className="w-full resize-none bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 text-sm leading-relaxed max-h-32"
              style={{ height: 'auto' }}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className={`flex-shrink-0 p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${
              message.trim() && !disabled
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-lg hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>

        {/* Character count and hints */}
        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </span>
          {message.length > 0 && (
            <span className={`text-xs ${
              message.length > 500 ? 'text-red-500' : 'text-gray-500'
            }`}>
              {message.length}/1000
            </span>
          )}
        </div>
      </form>
    </div>
  );
};