'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatMessage } from '@/types';
import { formatDate } from '@/lib/utils';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  onClearChat?: () => void;
}

export default function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  onClearChat,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const submitMessage = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">SupportMind AI</CardTitle>
          {onClearChat && messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearChat}
              className="text-gray-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                ¡Hola! Soy SupportMind AI
              </p>
              <p className="text-sm">
                Estoy aquí para ayudarte con tus consultas de soporte.
                ¿En qué puedo asistirte hoy?
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === 'USER' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'ASSISTANT' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    message.role === 'USER'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'USER'
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatDate(message.createdAt)}
                  </p>
                </div>

                {message.role === 'USER' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:100ms]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:200ms]"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje aquí..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
