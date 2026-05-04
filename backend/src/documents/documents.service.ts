import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionService } from './ingestion/ingestion.service';
import { VectorService } from './ingestion/vector.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ingestion: IngestionService,
    private readonly vectorService: VectorService,
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
      select: { id: true, tenantId: true, title: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => new DocumentResponseDto(d));
  }

  async findOne(tenantId: string, id: string): Promise<DocumentResponseDto> {
    const doc = await this.prisma.document.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');
    return new DocumentResponseDto(doc);
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id); // asserts ownership
    await this.vectorService.deleteByDocument(tenantId, id);
    await this.prisma.document.delete({ where: { id } });
    // DocumentChunk rows cascade from the Prisma relation.
  }
}
