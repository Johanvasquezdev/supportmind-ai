export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  maxUsers: number;
  maxTokens: number;
}

export interface Chat {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  companyId: string;
  messages: ChatMessage[];
  user?: User;
  _count?: {
    messages: number;
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  createdAt: string;
  chatId: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companyDomain?: string;
}

export interface SendMessageRequest {
  content: string;
  useRag?: boolean;
  maxContext?: number;
}

export interface SendMessageResponse {
  message: ChatMessage;
  tokensUsed: number;
  contextUsed: number;
}

export interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'READY' | 'FAILED';
  embeddingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'READY' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  _count?: {
    embeddings: number;
  };
}
