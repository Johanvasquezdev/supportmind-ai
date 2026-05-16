export class ConversationListItemDto {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
}

export class ConversationMessagesDto {
  conversation: {
    id: string;
    title: string | null;
    createdAt: string;
  };
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }>;
}
