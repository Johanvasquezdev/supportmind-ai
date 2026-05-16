import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RagService, RagChunk } from '../rag/rag.service';
import { AiService, AnswerMode } from '../ai/ai.service';
import { SearchService, HybridSearchResult } from '../search/search.service';
import { DocumentsService } from '../documents/documents.service';
import { ApiChatDto } from './dto/api-chat.dto';
import { ApiSearchDto } from './dto/api-search.dto';

const RAG_TOP_K = 5;

// ─── Response Types ─────────────────────────────────────────────────────────

export interface ApiChatResponse {
  id: string;
  answer: string;
  conversationId: string;
  sources: Array<{
    documentId: string;
    documentTitle: string;
    excerpt: string;
    score: number;
  }>;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  latencyMs: number;
}

export interface ApiSearchResponse {
  results: Array<{
    documentId: string;
    documentTitle: string;
    excerpt: string;
    hybridScore: number;
    vectorScore: number;
    keywordScore: number;
    chunkIndex: number;
  }>;
  query: string;
  totalResults: number;
  latencyMs: number;
}

export interface ApiDocumentsResponse {
  documents: Array<{
    id: string;
    title: string;
    status: string;
    chunkCount: number;
    createdAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

export interface ApiUsageResponse {
  plan: string;
  period: {
    start: string;
    end: string;
  };
  messages: {
    used: number;
    limit: number;
    remaining: number;
  };
  apiRequests: {
    used: number;
    limit: number;
  };
}

@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
    private readonly aiService: AiService,
    private readonly searchService: SearchService,
    private readonly documentsService: DocumentsService,
  ) {}

  // ─── Chat ──────────────────────────────────────────────────────────────────

  async chat(dto: ApiChatDto, tenantId: string): Promise<ApiChatResponse> {
    const startedAt = Date.now();
    const mode: AnswerMode = dto.mode ?? 'answer';

    // Get or create conversation
    let conversationId = dto.conversationId;
    if (!conversationId) {
      const conversation = await this.prisma.conversation.create({
        data: {
          tenantId,
          userId: 'api',
          title: this.generateTitle(dto.message),
        },
      });
      conversationId = conversation.id;
    }

    // Save user message
    const userMessage = await this.prisma.message.create({
      data: {
        tenantId,
        conversationId,
        role: 'user',
        content: dto.message,
      },
    });

    // RAG + AI
    const context = await this.ragService.retrieve(dto.message, tenantId, RAG_TOP_K);
    const result = await this.aiService.generateResponse({
      message: dto.message,
      context,
      mode,
    });

    // Save assistant message
    await this.prisma.message.create({
      data: {
        tenantId,
        conversationId,
        role: 'assistant',
        content: result.answer,
      },
    });

    // Track usage
    await this.prisma.usage.create({
      data: {
        tenantId,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        responseTimeMs: Date.now() - startedAt,
      },
    });

    return {
      id: userMessage.id,
      answer: result.answer,
      conversationId,
      sources: context.map((c) => ({
        documentId: c.metadata.documentId ?? '',
        documentTitle: c.metadata.documentTitle ?? 'Untitled',
        excerpt: c.text.slice(0, 200),
        score: c.score,
      })),
      usage: result.usage,
      model: 'gemini-2.0-flash',
      latencyMs: Date.now() - startedAt,
    };
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  async search(dto: ApiSearchDto, tenantId: string): Promise<ApiSearchResponse> {
    const startedAt = Date.now();
    const limit = dto.limit ?? 5;

    const results = await this.searchService.hybridSearch(
      dto.query,
      tenantId,
      { limit },
    );

    return {
      results: results.map((r) => ({
        documentId: r.documentId,
        documentTitle: r.documentTitle,
        excerpt: r.text.slice(0, 200),
        hybridScore: r.hybridScore,
        vectorScore: r.vectorScore,
        keywordScore: r.keywordScore,
        chunkIndex: r.chunkIndex,
      })),
      query: dto.query,
      totalResults: results.length,
      latencyMs: Date.now() - startedAt,
    };
  }

  // ─── Documents ─────────────────────────────────────────────────────────────

  async listDocuments(
    tenantId: string,
    status?: string,
    limit = 20,
    offset = 0,
  ): Promise<ApiDocumentsResponse> {
    const where: Record<string, unknown> = { tenantId };
    if (status) {
      where.status = status;
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          _count: { select: { chunks: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title ?? 'Untitled',
        status: d.status,
        chunkCount: d._count.chunks,
        createdAt: d.createdAt.toISOString(),
      })),
      total,
      limit: Math.min(limit, 100),
      offset,
    };
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  async getDocumentSummary(
    tenantId: string,
    documentId: string,
  ): Promise<{
    documentId: string;
    summary: string;
    generatedAt: string;
    cached: boolean;
  }> {
    const result = await this.documentsService.generateTextSummary(
      documentId,
      tenantId,
    );

    return {
      documentId,
      summary: result.summary,
      generatedAt: result.generatedAt.toISOString(),
      cached: result.cached,
    };
  }

  // ─── Usage ─────────────────────────────────────────────────────────────────

  async getUsage(tenantId: string): Promise<ApiUsageResponse> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    const plan = subscription?.plan ?? 'start';
    const periodStart = subscription?.currentPeriodStart ?? new Date();
    const periodEnd = subscription?.currentPeriodEnd ?? new Date();

    const [messagesUsed, apiRequestsUsed] = await Promise.all([
      this.prisma.usage.count({
        where: {
          tenantId,
          createdAt: { gte: periodStart },
        },
      }),
      this.prisma.apiRequest.count({
        where: {
          tenantId,
          createdAt: { gte: periodStart },
        },
      }),
    ]);

    const limits: Record<string, { messages: number; apiRequests: number }> = {
      start: { messages: 1000, apiRequests: 10000 },
      pro: { messages: 10000, apiRequests: 100000 },
      trialing: { messages: 100, apiRequests: 1000 },
    };

    const planLimits = limits[plan] ?? limits.start;

    return {
      plan,
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      messages: {
        used: messagesUsed,
        limit: planLimits.messages,
        remaining: Math.max(0, planLimits.messages - messagesUsed),
      },
      apiRequests: {
        used: apiRequestsUsed,
        limit: planLimits.apiRequests,
      },
    };
  }

  // ─── Plan lookup ──────────────────────────────────────────────────────────

  async getPlan(tenantId: string): Promise<string> {
    const sub = await this.prisma.subscription.findUnique({
      where: { tenantId },
      select: { plan: true },
    });
    return sub?.plan ?? 'start';
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private generateTitle(text: string): string {
    const cleaned = text.replace(/[^a-zA-Z0-9\s.,?!'-]/g, '').trim();
    if (cleaned.length <= 40) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return cleaned.slice(0, 40).trim() + '...';
  }
}
