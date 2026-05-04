'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import ChatList from '@/components/chat/ChatList';
import ChatInterface from '@/components/chat/ChatInterface';
import { Chat, ChatMessage } from '@/types';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ChatPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/chat');
    }
  }, [isAuthenticated, isLoading, router]);

  const createNewChat = async () => {
    try {
      const response = await api.post('/chat', {
        title: 'Nueva conversación',
      });
      const newChat = response.data;
      setActiveChatId(newChat.id);
      setMessages([]);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const selectChat = async (chatId: string) => {
    try {
      const response = await api.get(`/chat/${chatId}`);
      const chat = response.data;
      setCurrentChat(chat);
      setActiveChatId(chatId);
      setMessages(chat.messages || []);
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!activeChatId) {
      await createNewChat();
      // Wait a bit for state to update
      setTimeout(() => {
        sendMessage(content);
      }, 100);
      return;
    }

    const optimisticCreatedAt = new Date().toISOString();

    try {
      setIsSendingMessage(true);
      
      // Add user message optimistically
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        content,
        role: 'USER',
        createdAt: optimisticCreatedAt,
        chatId: activeChatId,
      };
      setMessages(prev => [...prev, userMessage]);

      const response = await api.post(`/chat/${activeChatId}/message`, {
        content,
        useRag: true,
        maxContext: 3,
      });

      // Add AI response
      setMessages(prev => [...prev, response.data.message]);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the optimistic user message if there was an error
      setMessages(prev => prev.filter(msg => msg.role !== 'USER' || msg.createdAt !== optimisticCreatedAt));
    } finally {
      setIsSendingMessage(false);
    }
  };

  const clearCurrentChat = async () => {
    if (!activeChatId) return;
    
    try {
      await api.delete(`/chat/${activeChatId}`);
      setActiveChatId(null);
      setCurrentChat(null);
      setMessages([]);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className={`${isMobile && activeChatId ? 'hidden' : 'w-full md:w-80 lg:w-96 bg-white border-r border-gray-200'} flex flex-col`}>
          <ChatList
            activeChatId={activeChatId || undefined}
            onChatSelect={selectChat}
            onNewChat={createNewChat}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Chat Interface */}
        <div className={`${isMobile && !activeChatId ? 'hidden' : 'flex-1 flex flex-col'}`}>
          {activeChatId && (
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveChatId(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <h2 className="font-medium">
                    {currentChat?.title || 'Nueva conversación'}
                  </h2>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex-1 p-4">
            <ChatInterface
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isSendingMessage}
              onClearChat={clearCurrentChat}
            />
          </div>
        </div>

        {/* Empty state when no chat is selected on desktop */}
        {!isMobile && !activeChatId && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecciona una conversación
              </h3>
              <p className="text-gray-500 mb-4">
                Elige una conversación existente o crea una nueva para empezar
              </p>
              <Button onClick={createNewChat}>
                Nueva conversación
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
