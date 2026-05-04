import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EmbeddingService,
  RetrievedChunk,
  VectorService,
} from '../documents/ingestion';

export interface RagChunk {
  vectorId: string;
  score: number;
  text: string;
  metadata: RetrievedChunk['metadata'];
}

@Injectable()
export class RagService {
  private static readonly DEFAULT_TOP_K = 5;
  private static readonly MIN_TOP_K = 3;
  private static readonly MAX_TOP_K = 5;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorService: VectorService,
  ) {}

  async retrieve(
    query: string,
    tenantId: string,
    topK = RagService.DEFAULT_TOP_K,
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
    const tenantScopedTopK = this.clampTopK(topK);
    return this.vectorService.query(
      queryEmbedding,
      cleanTenantId,
      tenantScopedTopK,
    );
  }

  private clampTopK(topK: number): number {
    if (!Number.isFinite(topK)) {
      return RagService.DEFAULT_TOP_K;
    }

    return Math.min(
      RagService.MAX_TOP_K,
      Math.max(RagService.MIN_TOP_K, Math.floor(topK)),
    );
  }
}
