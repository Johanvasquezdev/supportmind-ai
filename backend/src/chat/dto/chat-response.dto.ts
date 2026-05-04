import { RagChunk } from '../../rag/rag.service';

export class ChatResponseDto {
  conversationId: string;
  message: string;
  context: RagChunk[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}
