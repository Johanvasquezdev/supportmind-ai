import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  EmbeddingService,
  RetrievedChunk,
  VectorService,
} from '../documents/ingestion';
import { PrismaService } from '../prisma/prisma.service';

export interface RagChunk {
  vectorId: string;
  score: number;
  text: string;
  metadata: RetrievedChunk['metadata'] & {
    documentTitle?: string;
  };
}

@Injectable()
export class RagService {
  private static readonly DEFAULT_TOP_K = 10;
  private static readonly MIN_TOP_K = 3;
  private static readonly MAX_TOP_K = 5;
  private static readonly MIN_SCORE_THRESHOLD = 0.55;

  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorService: VectorService,
    private readonly prisma: PrismaService,
  ) {}

  async retrieve(
    query: string,
    tenantId: string,
    topK = RagService.MAX_TOP_K,
  ): Promise<RagChunk[]> {
    const cleanQuery = query.trim();
    const cleanTenantId = tenantId.trim();

    if (!cleanQuery) {
      throw new BadRequestException('Query is required');
    }

    if (!cleanTenantId) {
      throw new BadRequestException('tenantId is required');
    }

    const queryEmbedding = await this.embeddingService.embedOne(cleanQuery);
    
    // We query more chunks initially than requested because we will deduplicate by document
    const initialTopK = 15; 
    
    const chunks = await this.vectorService.query(
      queryEmbedding,
      cleanTenantId,
      initialTopK,
    );

    // 1. Enrich chunks with document titles from Prisma
    const documentIds = [...new Set(chunks.flatMap(c => c.metadata.documentId ? [c.metadata.documentId] : []))];
    let enrichedChunks: RagChunk[] = chunks;

    if (documentIds.length > 0) {
      const documents = await this.prisma.document.findMany({
        where: {
          id: { in: documentIds as string[] },
          tenantId: cleanTenantId,
        },
        select: {
          id: true,
          title: true,
        },
      });

      const titleMap = new Map(documents.map(d => [d.id, d.title]));
      
      enrichedChunks = chunks.map(chunk => ({
        ...chunk,
        metadata: {
          ...chunk.metadata,
          documentTitle: titleMap.get(chunk.metadata.documentId!) || 'Unknown Document',
        },
      }));
    }

    // 2. Deduplicate by documentId, keeping only the highest scoring chunk per document
    const uniqueDocsMap = new Map<string, RagChunk>();
    
    for (const chunk of enrichedChunks) {
      const docId = chunk.metadata.documentId;
      
      if (!docId) {
        // Chunks without a documentId (if any) are kept as individual results
        uniqueDocsMap.set(chunk.vectorId, chunk);
        continue;
      }

      const existing = uniqueDocsMap.get(docId);
      if (!existing || chunk.score > existing.score) {
        uniqueDocsMap.set(docId, chunk);
      }
    }

    // 3. Convert back to array, sort by score, and limit to requested topK
    const finalTopK = this.clampTopK(topK);

    const deduped = Array.from(uniqueDocsMap.values())
      .sort((a, b) => b.score - a.score);

    // 4. Filter out chunks with score below threshold
    const filtered = deduped.filter(
      chunk => chunk.score >= RagService.MIN_SCORE_THRESHOLD,
    );

    this.logger.debug(
      `RAG: ${chunks.length} raw chunks → ${deduped.length} after dedup → ${filtered.length} after score filter`,
    );

    return filtered.slice(0, finalTopK);
  }

  private clampTopK(topK: number): number {
    if (!Number.isFinite(topK)) {
      return RagService.MAX_TOP_K;
    }

    return Math.min(
      RagService.MAX_TOP_K,
      Math.max(RagService.MIN_TOP_K, Math.floor(topK)),
    );
  }
}
