import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { VectorMetadata } from '../documents/ingestion';
import { SearchService } from '../search/search.service';

export interface RagChunk {
  vectorId: string;
  score: number;
  text: string;
  metadata: VectorMetadata & {
    documentTitle?: string;
  };
}

@Injectable()
export class RagService {
  private static readonly MIN_TOP_K = 3;
  private static readonly MAX_TOP_K = 5;
  private static readonly MIN_SCORE_THRESHOLD = 0.55;

  private readonly logger = new Logger(RagService.name);

  constructor(private readonly searchService: SearchService) {}

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

    const limit = this.clampTopK(topK);
    const results = await this.searchService.hybridSearch(cleanQuery, cleanTenantId, {
      limit,
      minScore: RagService.MIN_SCORE_THRESHOLD,
    });

    this.logger.debug(
      `RAG hybrid retrieval returned ${results.length} chunks for tenant=${cleanTenantId}`,
    );

    return results.map((result) => ({
      vectorId: result.chunkId,
      score: result.hybridScore,
      text: result.text,
      metadata: {
        tenantId: cleanTenantId,
        text: result.text,
        documentId: result.documentId,
        documentTitle: result.documentTitle,
        chunkIndex: result.chunkIndex,
      },
    }));
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
