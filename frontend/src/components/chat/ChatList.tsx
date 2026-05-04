'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, truncateText } from '@/lib/utils';
import { Chat } from '@/types';
import api from '@/lib/api';

interface ChatListProps {
  activeChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  refreshTrigger?: number;
}

export default function ChatList({
  activeChatId,
  onChatSelect,
  onNewChat,
  refreshTrigger,
}: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/chat');
      setChats(response.data.chats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats, refreshTrigger]);

  const filteredChats = chats.filter((chat) =>
    chat.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.messages.some(msg => 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getChatPreview = (chat: Chat): string => {
    const lastMessage = chat.messages[0];
    if (lastMessage) {
      return truncateText(lastMessage.content, 50);
    }
    return 'Nueva conversación';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <Button
          onClick={onNewChat}
          className="w-full mb-4"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva conversación
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Cargando conversaciones...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {searchTerm ? (
              <p>No se encontraron conversaciones que coincidan con la búsqueda</p>
            ) : (
              <div>
                <p className="mb-2">No tienes conversaciones aún</p>
                <p className="text-sm text-gray-400">
                  Crea una nueva conversación para empezar
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  activeChatId === chat.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-sm truncate flex-1">
                    {chat.title || getChatPreview(chat)}
                  </h3>
                  {chat._count && (
                    <span className="text-xs text-gray-500 ml-2">
                      {chat._count.messages} msgs
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {getChatPreview(chat)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(chat.updatedAt)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
