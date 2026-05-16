import {
  InternalServerErrorException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { IngestionService } from './ingestion/ingestion.service';
import { AiService } from '../ai/ai.service';
import { TablesService } from './tables.service';
import { InsightsService } from './insights.service';

const SUMMARY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SUMMARY_INPUT_LIMIT = 12_000;

export interface TextSummaryResult {
  summary: string;
  generatedAt: Date;
  cached: boolean;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => IngestionService))
    private readonly ingestion: IngestionService,
    private readonly ai: AiService,
    private readonly tables: TablesService,
    private readonly insights: InsightsService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(tenantId: string, dto: CreateDocumentDto): Promise<DocumentResponseDto> {
    const document = await this.prisma.document.create({
      data: { tenantId, title: dto.title, content: dto.content, status: 'PENDING' },
    });

    // Fire-and-forget — client polls GET /documents/:id for status
    this.ingestion
      .ingest(document.id, tenantId, dto.content)
      .catch((err) =>
        this.logger.error(`Ingestion failed [${document.id}]: ${err.message}`),
      );

    return new DocumentResponseDto(document);
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  async findAll(tenantId: string): Promise<DocumentResponseDto[]> {
    const docs = await this.prisma.document.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => new DocumentResponseDto({
      ...d,
      chunksCount: d._count.chunks,
    }));
  }

  async findOne(tenantId: string, id: string): Promise<DocumentResponseDto> {
    const doc = await this.prisma.document.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');
    return new DocumentResponseDto(doc);
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async remove(tenantId: string, id: string): Promise<void> {
    // Atomic tenant-scoped delete: find + delete in one query.
    // If the document doesn't exist or belongs to another tenant, deleteMany
    // returns count 0 — no data is leaked and no race condition is possible.
    await this.ingestion.removeDocumentVectors(tenantId, id);
    const { count } = await this.prisma.document.deleteMany({
      where: { id, tenantId },
    });
    if (count === 0) {
      throw new NotFoundException('Document not found');
    }
    // DocumentChunk rows cascade from the Prisma relation.
  }

  // ─── Status transitions (called by IngestionService) ──────────────────────

  async setStatus(
    tenantId: string,
    documentId: string,
    status: 'PROCESSING' | 'READY',
  ): Promise<void> {
    const { count } = await this.prisma.document.updateMany({
      where: { id: documentId, tenantId },
      data: { status },
    });
    if (count === 0) {
      this.logger.error(
        `setStatus failed: document ${documentId} not found for tenant ${tenantId}`,
      );
    }
  }

  async markFailed(
    tenantId: string,
    documentId: string,
    errorMsg: string,
  ): Promise<void> {
    const { count } = await this.prisma.document.updateMany({
      where: { id: documentId, tenantId },
      data: { status: 'FAILED', errorMsg },
    });
    if (count === 0) {
      this.logger.error(
        `markFailed failed: document ${documentId} not found for tenant ${tenantId}`,
      );
    }
  }

  async retry(tenantId: string, id: string): Promise<DocumentResponseDto> {
    const document = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.invalidateSummary(id, tenantId);
    await this.tables.deleteTablesForDocument(id, tenantId);
    await this.insights.deleteInsightsForDocument(id, tenantId);

    // Reset status to PENDING
    await this.prisma.document.update({
      where: { id },
      data: { status: 'PENDING', errorMsg: null },
    });

    // Fire-and-forget ingestion
    this.ingestion
      .ingest(document.id, tenantId, document.content)
      .catch((err) =>
        this.logger.error(`Retry ingestion failed [${document.id}]: ${err.message}`),
      );

    return new DocumentResponseDto({ ...document, status: 'PENDING', errorMsg: null });
  }

  async persistChunks(
    chunks: {
      tenantId: string;
      documentId: string;
      chunkIndex: number;
      text: string;
      vectorId: string;
    }[],
  ): Promise<void> {
    await this.prisma.documentChunk.createMany({ data: chunks });
  }

  async generateTextSummary(
    documentId: string,
    tenantId: string,
  ): Promise<TextSummaryResult> {
    const startedAt = Date.now();
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, tenantId },
      select: {
        id: true,
        content: true,
        textSummary: true,
        textSummaryAt: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const summaryAgeMs = document.textSummaryAt
      ? Date.now() - document.textSummaryAt.getTime()
      : Number.POSITIVE_INFINITY;

    if (document.textSummary && document.textSummaryAt && summaryAgeMs < SUMMARY_CACHE_TTL_MS) {
      this.logger.log(`Returning cached summary for ${documentId}`);
      return {
        summary: document.textSummary,
        generatedAt: document.textSummaryAt,
        cached: true,
      };
    }

    this.logger.log(`Generating text summary for ${documentId}`);
    const content = document.content.trim().slice(0, SUMMARY_INPUT_LIMIT);
    const prompt = [
      'You are a professional document analyst.',
      'Generate a concise, well-structured text summary of the following document.',
      '',
      'Requirements:',
      '- 3 to 5 clear paragraphs',
      '- Plain prose, no bullet points, no headers',
      '- Capture the main purpose, key information, and any important details',
      '- Write in the same language as the document',
      '- Be specific, not generic',
      '',
      `Document:\n${content}`,
    ].join('\n');

    let summary: string;
    try {
      summary = await this.ai.generateSummary(prompt);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown AI error';
      this.logger.error(`Summary generation failed for ${documentId}: ${message}`);
      throw new InternalServerErrorException('Failed to generate document summary');
    }

    const generatedAt = new Date();
    await this.prisma.document.updateMany({
      where: { id: documentId, tenantId },
      data: {
        textSummary: summary,
        textSummaryAt: generatedAt,
      },
    });

    this.logger.log(
      `Generated text summary for ${documentId} in ${Date.now() - startedAt}ms`,
    );

    return {
      summary,
      generatedAt,
      cached: false,
    };
  }

  async invalidateSummary(documentId: string, tenantId: string): Promise<void> {
    const { count } = await this.prisma.document.updateMany({
      where: { id: documentId, tenantId },
      data: {
        textSummary: null,
        textSummaryAt: null,
      },
    });

    if (count === 0) {
      throw new NotFoundException('Document not found');
    }
  }
}
