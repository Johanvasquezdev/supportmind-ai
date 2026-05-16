import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { ChunkingService, Chunk, ChunkingOptions } from './chunking.service';
import { EmbeddingService, EmbeddingResult } from './embedding.service';
import { VectorRecord, VectorService } from './vector.service';
import { DocumentsService } from '../documents.service';

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

/**
 * Chunking configuration for the ingestion pipeline.
 *
 * - **500–1000 tokens**: Large enough for a full paragraph/policy, small
 *   enough to produce focused embedding vectors.
 * - **150 tokens overlap**: Ensures sentences near chunk boundaries appear
 *   in full in at least one chunk, preventing "boundary blindness" where
 *   a question about content at the edge gets weak matches from both
 *   adjacent chunks.
 */
const INGESTION_CHUNK_OPTIONS: ChunkingOptions = {
  minTokens: 500,
  maxTokens: 1000,
  overlapTokens: 150,
};

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @Inject(forwardRef(() => DocumentsService))
    private readonly documentsService: DocumentsService,
    private readonly chunking: ChunkingService,
    private readonly embedding: EmbeddingService,
    private readonly vectorService: VectorService,
  ) {}

  /**
   * Full ingestion pipeline:
   *   content → chunks → embeddings → vector store + DB
   *
   * Orchestrates chunking + embedding + vector storage.
   * Delegates all DB operations back to DocumentsService.
   */
  async ingest(documentId: string, tenantId: string, content: string): Promise<void> {
    try {
      await this.documentsService.setStatus(tenantId, documentId, 'PROCESSING');

      // 1. Split into sentence-aware, section-respecting, overlapping chunks
      const chunks: Chunk[] = this.chunking.chunk(content, INGESTION_CHUNK_OPTIONS);
      this.logger.log(
        `[${documentId}] ${chunks.length} chunks ` +
          `(avg ~${Math.round(chunks.reduce((s, c) => s + c.tokenEstimate, 0) / (chunks.length || 1))} tokens/chunk)`,
      );

      if (chunks.length === 0) {
        this.logger.warn(`[${documentId}] No chunks produced — marking READY with empty content`);
        await this.documentsService.setStatus(tenantId, documentId, 'READY');
        return;
      }

      // 2. Generate Gemini embeddings for each chunk
      const embeddedChunks = await this.generateEmbeddings(documentId, tenantId, chunks);

      this.logger.log(
        `[${documentId}] Embedded ${embeddedChunks.length} chunks ` +
          `(model: ${embeddedChunks[0].embeddingModel}, dims: ${embeddedChunks[0].dimensions})`,
      );

      // 3. Persist to vector store
      const vectorRecords = this.toVectorRecords(embeddedChunks);
      await this.vectorService.upsert(vectorRecords);

      // 4. Persist chunk metadata to relational DB (via DocumentsService)
      const chunkRows = embeddedChunks.map((ec) => ({
        tenantId: ec.tenantId,
        documentId: ec.documentId,
        chunkIndex: ec.chunkIndex,
        text: ec.text,
        vectorId: ec.vectorId,
      }));
      await this.documentsService.persistChunks(chunkRows);

      await this.documentsService.setStatus(tenantId, documentId, 'READY');
      this.logger.log(`[${documentId}] ingestion complete — ${embeddedChunks.length} chunks persisted`);
    } catch (err) {
      this.logger.error(`[${documentId}] ingestion failed: ${err.message}`);
      await this.documentsService.markFailed(tenantId, documentId, String(err.message));
      throw err;
    }
  }

  /**
   * Removes all vectors associated with a document.
   * Called by DocumentsService during document deletion.
   */
  async removeDocumentVectors(tenantId: string, documentId: string): Promise<void> {
    await this.vectorService.deleteByDocument(tenantId, documentId);
  }

  // ─── Embedding step ────────────────────────────────────────────────────

  /**
   * For each chunk:
   *   1. Call the configured embedding model
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
      vectorId: `${tenantId}-${documentId}-${chunk.index}`,
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
}
