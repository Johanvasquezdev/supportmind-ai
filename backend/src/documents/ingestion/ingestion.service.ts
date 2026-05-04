import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChunkingService, Chunk } from './chunking.service';
import { EmbeddingService, EmbeddingResult } from './embedding.service';
import { VectorRecord, VectorService } from './vector.service';

/**
 * Represents a single chunk after embedding — the enriched object
 * that gets stored in both the vector store and the relational DB.
 */
export interface EmbeddedChunk {
  /** Dense vector representation of the text. */
  vector: number[];
  /** The original chunk text. */
  text: string;
  /** Tenant this chunk belongs to. */
  tenantId: string;
  /** Parent document ID. */
  documentId: string;
  /** Position within the document (zero-based). */
  chunkIndex: number;
  /** Unique vector ID for the vector store. */
  vectorId: string;
  /** Estimated token count of the chunk. */
  tokenEstimate: number;
  /** Embedding model used. */
  embeddingModel: string;
  /** Dimensionality of the vector. */
  dimensions: number;
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chunking: ChunkingService,
    private readonly embedding: EmbeddingService,
    private readonly vectorService: VectorService,
  ) {}

  /**
   * Full ingestion pipeline:
   *   content → chunks → embeddings → vector store + DB
   *
   * Owns all status transitions. Called fire-and-forget from DocumentsService.
   */
  async ingest(documentId: string, tenantId: string, content: string): Promise<void> {
    try {
      await this.setStatus(documentId, 'PROCESSING');

      // 1. Split into sentence-aware, overlapping chunks
      const chunks: Chunk[] = this.chunking.chunk(content);
      this.logger.log(
        `[${documentId}] ${chunks.length} chunks ` +
          `(avg ~${Math.round(chunks.reduce((s, c) => s + c.tokenEstimate, 0) / (chunks.length || 1))} tokens/chunk)`,
      );

      if (chunks.length === 0) {
        this.logger.warn(`[${documentId}] No chunks produced — marking READY with empty content`);
        await this.setStatus(documentId, 'READY');
        return;
      }

      // 2. Generate embeddings via OpenAI (text-embedding-3-small)
      const embeddedChunks = await this.generateEmbeddings(documentId, tenantId, chunks);

      this.logger.log(
        `[${documentId}] Embedded ${embeddedChunks.length} chunks ` +
          `(model: ${embeddedChunks[0].embeddingModel}, dims: ${embeddedChunks[0].dimensions})`,
      );

      // 3. Persist to vector store
      const vectorRecords = this.toVectorRecords(embeddedChunks);
      await this.vectorService.upsert(vectorRecords);

      // 4. Persist to relational DB
      const chunkRows = embeddedChunks.map((ec) => ({
        tenantId: ec.tenantId,
        documentId: ec.documentId,
        chunkIndex: ec.chunkIndex,
        text: ec.text,
        vectorId: ec.vectorId,
      }));
      await this.prisma.documentChunk.createMany({ data: chunkRows });

      await this.setStatus(documentId, 'READY');
      this.logger.log(`[${documentId}] ingestion complete — ${embeddedChunks.length} chunks persisted`);
    } catch (err) {
      this.logger.error(`[${documentId}] ingestion failed: ${err.message}`);
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED', errorMsg: String(err.message) },
      });
      throw err;
    }
  }

  // ─── Embedding step ────────────────────────────────────────────────────

  /**
   * For each chunk:
   *   1. Call OpenAI text-embedding-3-small
   *   2. Build an EmbeddedChunk: { vector, text, tenantId, ... }
   *
   * This method is intentionally public so it can be unit-tested
   * and reused independently (e.g., for re-embedding).
   */
  async generateEmbeddings(
    documentId: string,
    tenantId: string,
    chunks: Chunk[],
  ): Promise<EmbeddedChunk[]> {
    const texts = chunks.map((c) => c.text);
    const embeddings: EmbeddingResult[] = await this.embedding.embedWithMetadata(texts);

    return chunks.map((chunk, i) => ({
      vector: embeddings[i].vector,
      text: chunk.text,
      tenantId,
      documentId,
      chunkIndex: chunk.index,
      vectorId: `${documentId}-${chunk.index}`,
      tokenEstimate: chunk.tokenEstimate,
      embeddingModel: embeddings[i].model,
      dimensions: embeddings[i].dimensions,
    }));
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  /**
   * Converts EmbeddedChunk[] to VectorRecord[] for the vector store.
   */
  private toVectorRecords(embeddedChunks: EmbeddedChunk[]): VectorRecord[] {
    return embeddedChunks.map((ec) => ({
      id: ec.vectorId,
      values: ec.vector,
      metadata: {
        tenantId: ec.tenantId,
        documentId: ec.documentId,
        chunkIndex: ec.chunkIndex,
        text: ec.text,
      },
    }));
  }

  private async setStatus(documentId: string, status: 'PROCESSING' | 'READY') {
    await this.prisma.document.update({
      where: { id: documentId },
      data: { status },
    });
  }
}
