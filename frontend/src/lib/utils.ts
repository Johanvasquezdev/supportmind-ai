import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AxiosError } from 'axios';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateChatTitle(messages: Array<{ role: string; content: string }>): string {
  const userMessages = messages.filter(m => m.role === 'USER');
  if (userMessages.length === 0) return 'Nueva conversación';
  
  const firstMessage = userMessages[0].content;
  return truncateText(firstMessage, 50);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    return message ?? fallback;
  }

  return fallback;
}
