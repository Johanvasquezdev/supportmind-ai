import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { IngestionService } from './ingestion/ingestion.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ingestion: IngestionService,
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
}
