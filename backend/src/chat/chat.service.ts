import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AiService, AnswerMode, ConversationMessage } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { RagChunk, RagService } from '../rag/rag.service';
import { ChatResponseDto } from './dto/chat-response.dto';

interface SendMessageInput {
  tenantId: string;
  userId: string;
  message: string;
  conversationId?: string;
  mode?: AnswerMode;
}

interface StreamMessageInput extends SendMessageInput {
  onToken: (token: string) => void;
  onDone: (result: { conversationId: string; context: RagChunk[]; usage: { inputTokens: number; outputTokens: number; totalTokens: number } }) => void;
  onError: (error: Error) => void;
}

const RAG_TOP_K = 5;
const MAX_HISTORY_MESSAGES = 20;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
    private readonly aiService: AiService,
  ) {}

  async sendMessage(input: SendMessageInput): Promise<ChatResponseDto> {
    const message = input.message.trim();

    if (!message) {
      throw new BadRequestException('message is required');
    }

    const conversation = input.conversationId
      ? await this.getTenantConversation(input.tenantId, input.conversationId)
      : await this.createConversation(input.tenantId, input.userId);

    const [history, context] = await Promise.all([
      this.getHistory(input.tenantId, conversation.id),
      this.ragService.retrieve(message, input.tenantId, RAG_TOP_K),
    ]);
    const startTime = Date.now();
    const aiResponse = await this.aiService.generateResponse({
      message,
      context,
      history,
      mode: input.mode ?? 'answer',
    });
    const responseTimeMs = Date.now() - startTime;

    await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          tenantId: input.tenantId,
          conversationId: conversation.id,
          role: 'user',
          content: message,
        },
      }),
      this.prisma.message.create({
        data: {
          tenantId: input.tenantId,
          conversationId: conversation.id,
          role: 'assistant',
          content: aiResponse.answer,
        },
      }),
    ]);

    // Track token usage for billing/analytics
    await this.trackUsage(input.tenantId, {
      ...aiResponse.usage,
      responseTimeMs,
    });

    return {
      conversationId: conversation.id,
      message: aiResponse.answer,
      context: aiResponse.context,
      usage: aiResponse.usage,
    };
  }

  async streamMessage(input: StreamMessageInput): Promise<void> {
    const message = input.message.trim();

    if (!message) {
      input.onError(new BadRequestException('message is required'));
      return;
    }

    let conversation;
    try {
      conversation = input.conversationId
        ? await this.getTenantConversation(input.tenantId, input.conversationId)
        : await this.createConversation(input.tenantId, input.userId);
    } catch (err) {
      input.onError(err instanceof Error ? err : new Error('Failed to get conversation'));
      return;
    }

    const [history, context] = await Promise.all([
      this.getHistory(input.tenantId, conversation.id),
      this.ragService.retrieve(message, input.tenantId, RAG_TOP_K),
    ]);

    if (context.length === 0) {
      const fallback = "I don't have enough information in the provided company knowledge base to answer that.";
      input.onToken(fallback);
      input.onDone({
        conversationId: conversation.id,
        context: [],
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      });
      return;
    }

    const promptTokens = this.estimatePromptTokens(message, context, history, input.mode ?? 'answer');
    let fullResponse = '';
    let outputTokens = 0;

    try {
      for await (const token of this.aiService.streamResponse({
        message,
        context,
        history,
        mode: input.mode ?? 'answer',
      })) {
        fullResponse += token;
        outputTokens++;
        input.onToken(token);
      }

      const usage = {
        inputTokens: promptTokens,
        outputTokens,
        totalTokens: promptTokens + outputTokens,
      };

      // Save messages after stream completes
      await this.saveMessages(input.tenantId, conversation.id, message, fullResponse);

      // Track usage
      await this.trackUsage(input.tenantId, usage);

      input.onDone({
        conversationId: conversation.id,
        context,
        usage,
      });
    } catch (err) {
      this.logger.error(`Stream error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      input.onError(err instanceof Error ? err : new Error('Stream failed'));
    }
  }

  private async saveMessages(
    tenantId: string,
    conversationId: string,
    userMessage: string,
    assistantMessage: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          tenantId,
          conversationId,
          role: 'user',
          content: userMessage,
        },
      }),
      this.prisma.message.create({
        data: {
          tenantId,
          conversationId,
          role: 'assistant',
          content: assistantMessage,
        },
      }),
    ]);
  }

  private estimatePromptTokens(
    message: string,
    context: RagChunk[],
    history: ConversationMessage[],
    mode: AnswerMode,
  ): number {
    const systemPrompt = [
      'You are SupportMind AI, a customer support assistant.',
      'Answer only using the provided company context.',
      'If the context does not contain the answer, say you do not have enough information.',
      'Do not guess, invent policies, or use outside knowledge.',
      'When possible, cite the context number like [Context 1].',
      'Keep answers concise, helpful, and professional.',
      mode === 'summary' ? 'Mode: summary. Summarize the relevant context into clear bullets, then mention the main source context numbers.' :
        mode === 'exact' ? 'Mode: exact answer. Give the shortest direct answer supported by the context. If useful, quote only a short phrase from the context.' :
          'Mode: answer. Answer the user question directly using the context.',
    ].join('\n');

    const contextText = context
      .map((chunk, idx) => `[Context ${idx + 1}]\nscore: ${chunk.score.toFixed(4)}\ndocumentId: ${chunk.metadata.documentId ?? 'unknown'}\nchunkIndex: ${chunk.metadata.chunkIndex ?? 'unknown'}\n${chunk.text}`)
      .join('\n\n');

    const historyText = history.map(m => `${m.role}: ${m.content}`).join('\n');

    const fullPrompt = [systemPrompt, `Company context:\n${contextText}`, historyText, `user: ${message}`].join('\n');

    return this.aiService.estimateTokens(fullPrompt);
  }

  async getConversations(tenantId: string, userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        tenantId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });
  }

  async getConversationMessages(tenantId: string, conversationId: string) {
    // Verify ownership
    await this.getTenantConversation(tenantId, conversationId);

    return this.prisma.message.findMany({
      where: {
        tenantId,
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  private async createConversation(tenantId: string, userId: string) {
    return this.prisma.conversation.create({
      data: {
        tenantId,
        userId,
      },
    });
  }

  private async getTenantConversation(tenantId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  private async getHistory(
    tenantId: string,
    conversationId: string,
  ): Promise<ConversationMessage[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        tenantId,
        conversationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: MAX_HISTORY_MESSAGES,
      select: {
        role: true,
        content: true,
      },
    });

    return messages
      .reverse()
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        role: message.role as ConversationMessage['role'],
        content: message.content,
      }));
  }

  private async trackUsage(
    tenantId: string,
    usage: { inputTokens: number; outputTokens: number; responseTimeMs?: number },
  ): Promise<void> {
    if (usage.inputTokens === 0 && usage.outputTokens === 0) {
      return;
    }

    await this.prisma.usage.create({
      data: {
        tenantId,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        responseTimeMs: usage.responseTimeMs,
      },
    });
  }
}
