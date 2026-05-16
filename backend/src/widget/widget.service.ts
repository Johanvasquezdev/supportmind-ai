import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RagChunk, RagService } from '../rag/rag.service';
import { AiService } from '../ai/ai.service';
import { WidgetChatDto } from './dto/widget-chat.dto';

const SESSION_MESSAGE_LIMIT = 100;
const RAG_TOP_K = 5;
const HISTORY_LIMIT = 20;

const WIDGET_SYSTEM_PROMPT = [
  'You are a helpful AI support assistant.',
  'Answer questions using ONLY the provided context.',
  'If the answer is not in the context, say:',
  '"I don\'t have information about that. Please contact our support team directly."',
  'Be concise and friendly.',
  'Do not make up information.',
].join('\n');

export interface WidgetChatResult {
  answer: string;
  sessionId: string;
  sources: RagChunk[];
  messageCount: number;
}

export interface WidgetConfigResult {
  primaryColor: string;
  position: string;
  placeholder: string;
  title: string;
  welcomeMessage: string;
  isEnabled: boolean;
  allowedOrigins: string[];
}

const DEFAULT_CONFIG: WidgetConfigResult = {
  primaryColor: '#7c3aed',
  position: 'bottom-right',
  placeholder: 'Ask us anything...',
  title: 'Support',
  welcomeMessage: 'Hi! How can I help you today?',
  isEnabled: true,
  allowedOrigins: [],
};

@Injectable()
export class WidgetService {
  private readonly logger = new Logger(WidgetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
    private readonly aiService: AiService,
  ) {}

  // ─── Chat ─────────────────────────────────────────────────────────────────

  async chat(dto: WidgetChatDto, tenantId: string): Promise<WidgetChatResult> {
    // a. Validate widget is enabled
    const config = await this.prisma.widgetConfig.findUnique({
      where: { tenantId },
      select: { isEnabled: true },
    });

    if (config && !config.isEnabled) {
      throw new ForbiddenException('Widget is disabled for this account');
    }

    // b. Get or create session
    const session = await this.prisma.widgetSession.upsert({
      where: {
        tenantId_sessionId: { tenantId, sessionId: dto.sessionId },
      },
      create: {
        tenantId,
        sessionId: dto.sessionId,
        messageCount: 1,
        lastActiveAt: new Date(),
      },
      update: {
        messageCount: { increment: 1 },
        lastActiveAt: new Date(),
      },
    });

    // c. Abuse prevention
    if (session.messageCount > SESSION_MESSAGE_LIMIT) {
      throw new ForbiddenException('Session message limit reached. Please start a new session.');
    }

    this.logger.log(
      `Widget chat [tenant=${tenantId.slice(0, 8)} session=${dto.sessionId.slice(0, 8)}]`,
    );

    // d. RAG retrieval
    const context = await this.ragService.retrieve(dto.message, tenantId, RAG_TOP_K);

    // e. Build prompt
    const history = (dto.conversationHistory ?? []).slice(-4).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // f. Generate response
    let answer: string;

    if (context.length === 0) {
      answer =
        "I don't have information about that in our knowledge base. Please contact our support team directly for assistance.";
    } else {
      const aiResponse = await this.aiService.generateResponse({
        message: dto.message,
        context,
        history,
        mode: 'answer',
        systemPromptOverride: WIDGET_SYSTEM_PROMPT,
      });
      answer = aiResponse.answer;
    }

    // g. Save messages
    const sourcesJson = context.length > 0
      ? context.map((c) => ({
          vectorId: c.vectorId,
          score: c.score,
          text: c.text.slice(0, 200),
          documentId: c.metadata.documentId,
        }))
      : null;

    await Promise.all([
      this.prisma.widgetMessage.create({
        data: {
          tenantId,
          sessionId: dto.sessionId,
          role: 'user',
          content: dto.message,
        },
      }),
      this.prisma.widgetMessage.create({
        data: {
          tenantId,
          sessionId: dto.sessionId,
          role: 'assistant',
          content: answer,
          sources: sourcesJson,
        },
      }),
    ]);

    return {
      answer,
      sessionId: dto.sessionId,
      sources: context,
      messageCount: session.messageCount,
    };
  }

  // ─── History ──────────────────────────────────────────────────────────────

  async getHistory(
    sessionId: string,
    tenantId: string,
  ): Promise<Array<{
    id: string;
    role: string;
    content: string;
    sources: unknown;
    createdAt: Date;
  }>> {
    return this.prisma.widgetMessage.findMany({
      where: { tenantId, sessionId },
      orderBy: { createdAt: 'asc' },
      take: HISTORY_LIMIT,
      select: {
        id: true,
        role: true,
        content: true,
        sources: true,
        createdAt: true,
      },
    });
  }

  // ─── Config ───────────────────────────────────────────────────────────────

  async getConfig(tenantId: string): Promise<WidgetConfigResult> {
    const config = await this.prisma.widgetConfig.findUnique({
      where: { tenantId },
      select: {
        primaryColor: true,
        position: true,
        placeholder: true,
        title: true,
        welcomeMessage: true,
        isEnabled: true,
        allowedOrigins: true,
      },
    });

    return config ?? DEFAULT_CONFIG;
  }
}
