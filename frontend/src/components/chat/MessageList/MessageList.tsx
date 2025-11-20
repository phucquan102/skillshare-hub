import React, { useEffect, useRef } from 'react';
import { Message } from './../../../types/chat.types';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isOwnMessage = (message: Message): boolean => {
    const senderId = typeof message.senderId === 'string'
      ? message.senderId
      : message.senderId?._id;

    return senderId === currentUserId;
  };

  const getSenderName = (message: Message): string => {
    if (typeof message.senderId === 'string') return 'Unknown User';
    return message.senderId?.fullName || 'Unknown User';
  };

  const getSenderAvatar = (message: Message): string => {
    if (typeof message.senderId === 'string') return '';
    return message.senderId?.profile?.avatar || '';
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const shouldShowDate = (currentMsg: Message, previousMsg: Message | null): boolean => {
    if (!previousMsg) return true;
    
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const previousDate = new Date(previousMsg.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  const uniqueMessages = messages.reduce((acc: Message[], msg) => {
    if (!acc.find((m) => m._id === msg._id)) {
      acc.push(msg);
    }
    return acc;
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-emerald-50/30">
      {uniqueMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-green-100 rounded-3xl flex items-center justify-center mb-4">
            <div className="text-3xl">💬</div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No messages yet</h3>
          <p className="text-gray-500 max-w-sm">
            Start the conversation by sending your first message!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {uniqueMessages.map((message, index) => {
            const own = isOwnMessage(message);
            const previousMessage = index > 0 ? uniqueMessages[index - 1] : null;
            const showDate = shouldShowDate(message, previousMessage);

            return (
              <div key={message._id} className="space-y-3">
                {showDate && (
                  <div className="flex justify-center">
                    <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-200/60 shadow-sm">
                      <span className="text-sm font-medium text-gray-600">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className={`flex items-end gap-3 ${own ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  {!own && (
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                        {getSenderAvatar(message) ? (
                          <img 
                            src={getSenderAvatar(message)} 
                            alt={getSenderName(message)}
                            className="w-full h-full rounded-2xl object-cover"
                          />
                        ) : (
                          getSenderName(message).charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={`flex flex-col ${own ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {!own && (
                      <div className="flex items-center gap-2 mb-1 ml-1">
                        <span className="text-sm font-semibold text-gray-700">
                          {getSenderName(message)}
                        </span>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <div className={`relative group ${
                        own 
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' 
                          : 'bg-white/90 backdrop-blur-sm border border-gray-200/60 text-gray-800'
                      } rounded-3xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 ${
                        own ? 'rounded-br-md' : 'rounded-bl-md'
                      }`}>
                        <div className="text-sm leading-relaxed break-words">
                          {message.content}
                        </div>
                        
                        {/* Message Status */}
                        {own && (
                          <div className="flex items-center justify-end gap-1 mt-2">
                            <span className="text-xs opacity-80">
                              {formatTime(message.createdAt)}
                            </span>
                            <FiCheckCircle className="w-3 h-3 text-white opacity-80" />
                          </div>
                        )}
                      </div>
                      
                      {!own && (
                        <div className="flex items-center gap-1 ml-1">
                          <span className="text-xs text-gray-500">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Own message avatar */}
                  {own && (
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                        You
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
};