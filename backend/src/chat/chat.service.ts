import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AiService, AnswerMode, ConversationMessage } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import { ChatResponseDto } from './dto/chat-response.dto';

interface SendMessageInput {
  tenantId: string;
  userId: string;
  message: string;
  conversationId?: string;
  mode?: AnswerMode;
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

    const history = await this.getHistory(input.tenantId, conversation.id);
    const context = await this.ragService.retrieve(
      message,
      input.tenantId,
      RAG_TOP_K,
    );
    const aiResponse = await this.aiService.generateResponse({
      message,
      context,
      history,
      mode: input.mode ?? 'answer',
    });

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
    await this.trackUsage(input.tenantId, aiResponse.usage);

    return {
      conversationId: conversation.id,
      message: aiResponse.answer,
      context: aiResponse.context,
      usage: aiResponse.usage,
    };
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
    usage: { inputTokens: number; outputTokens: number },
  ): Promise<void> {
    if (usage.inputTokens === 0 && usage.outputTokens === 0) {
      return;
    }

    await this.prisma.usage.create({
      data: {
        tenantId,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    });
  }
}
