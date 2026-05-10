import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Index,
  Pinecone,
  PineconeRecord,
  RecordMetadata,
} from '@pinecone-database/pinecone';

export type VectorMetadata = RecordMetadata & {
  tenantId: string;
  text: string;
  documentId?: string;
  chunkIndex?: number;
};

export interface VectorRecord {
  id: string;
  values: number[];
  metadata: VectorMetadata;
}

export interface RetrievedChunk {
  vectorId: string;
  score: number;
  text: string;
  metadata: VectorMetadata;
}

@Injectable()
export class VectorService {
  private readonly logger = new Logger(VectorService.name);
  private readonly store = new Map<string, VectorRecord>();
  private readonly index?: Index<VectorMetadata>;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('PINECONE_API_KEY');
    const indexName =
      this.config.get<string>('PINECONE_INDEX_NAME') ??
      this.config.get<string>('PINECONE_INDEX');

    if (this.isConfigured(apiKey) && this.isConfigured(indexName)) {
      const pinecone = new Pinecone({ apiKey });
      this.index = pinecone.index<VectorMetadata>({ name: indexName });
      this.logger.log(`Using Pinecone index "${indexName}"`);
    } else {
      this.logger.warn('Pinecone is not configured; using in-memory vectors');
    }
  }

  // ─── Write ──────────────────────────────────────────────────────────────

  /**
   * Upserts vectors into Pinecone (or the in-memory fallback).
   *
   * Every record MUST carry a valid tenantId in its metadata.
   * All records in a single batch MUST belong to the same tenant —
   * mixing tenants in one upsert is a programming error and will throw.
   */
  async upsert(vectors: VectorRecord[]): Promise<void> {
    if (vectors.length === 0) return;

    // Validate every record has a tenantId and they all match
    const tenantIds = new Set<string>();
    const records: PineconeRecord<VectorMetadata>[] = [];

    for (const vector of vectors) {
      const record = this.toRecord(vector); // throws if tenantId or text missing
      tenantIds.add(vector.metadata.tenantId);
      records.push(record);
    }

    if (tenantIds.size > 1) {
      throw new BadRequestException(
        `Upsert batch contains mixed tenants: [${[...tenantIds].join(', ')}]. ` +
          'All records in a single upsert must belong to one tenant.',
      );
    }

    if (this.index) {
      await this.index.upsert({ records });
      return;
    }

    for (const record of records) {
      this.store.set(record.id, {
        id: record.id,
        values: record.values ?? [],
        metadata: record.metadata,
      });
    }
  }

  // ─── Read ───────────────────────────────────────────────────────────────

  /**
   * Queries for the topK most similar vectors, strictly scoped to
   * the given tenantId.
   *
   * Pinecone path: uses server-side metadata filter { tenantId: { $eq } }
   * so no cross-tenant data is ever returned from the index.
   *
   * In-memory path: filters by tenantId before scoring.
   */
  async query(
    values: number[],
    tenantId: string,
    topK = 5,
  ): Promise<RetrievedChunk[]> {
    this.assertTenantId(tenantId, 'query');

    if (this.index) {
      const response = await this.index.query({
        vector: values,
        topK,
        includeMetadata: true,
        filter: {
          tenantId: { $eq: tenantId },
        },
      });

      return response.matches.flatMap((match) => {
        const metadata = match.metadata;

        // Defense-in-depth: verify the returned metadata actually matches
        // the requested tenant. Pinecone filters should guarantee this,
        // but we verify it to catch misconfigured indexes or SDK bugs.
        if (metadata && metadata.tenantId !== tenantId) {
          this.logger.error(
            `Tenant mismatch in Pinecone response: requested "${tenantId}", ` +
              `got "${metadata.tenantId}" for vector "${match.id}". Skipping.`,
          );
          return [];
        }

        return [{
          vectorId: match.id,
          score: match.score ?? 0,
          text: metadata?.text ?? '',
          metadata: metadata ?? { tenantId, text: '' },
        }];
      });
    }

    return Array.from(this.store.values())
      .filter((record) => record.metadata.tenantId === tenantId)
      .map((record) => ({
        record,
        score: this.cosineSimilarity(values, record.values),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ record, score }) => ({
        vectorId: record.id,
        score,
        text: record.metadata.text,
        metadata: record.metadata,
      }));
  }

  // ─── Delete ─────────────────────────────────────────────────────────────

  /**
   * Deletes all vectors for a given tenant + document pair.
   * Both tenantId and documentId are required in the Pinecone filter
   * to prevent cross-tenant deletion.
   */
  async deleteByDocument(tenantId: string, documentId: string): Promise<void> {
    this.assertTenantId(tenantId, 'deleteByDocument');

    if (!documentId?.trim()) {
      throw new BadRequestException('documentId is required for deleteByDocument');
    }

    if (this.index) {
      await this.index.deleteMany({
        filter: {
          tenantId: { $eq: tenantId },
          documentId: { $eq: documentId },
        },
      });
      return;
    }

    for (const [id, record] of this.store.entries()) {
      if (
        record.metadata.tenantId === tenantId &&
        record.metadata.documentId === documentId
      ) {
        this.store.delete(id);
      }
    }
  }

  // ─── Diagnostic helpers (in-memory only) ────────────────────────────────

  get size(): number {
    return this.store.size;
  }

  getByTenant(tenantId: string): VectorRecord[] {
    this.assertTenantId(tenantId, 'getByTenant');
    return Array.from(this.store.values()).filter(
      (record) => record.metadata.tenantId === tenantId,
    );
  }

  getByDocument(tenantId: string, documentId: string): VectorRecord[] {
    this.assertTenantId(tenantId, 'getByDocument');
    return Array.from(this.store.values()).filter(
      (record) =>
        record.metadata.tenantId === tenantId &&
        record.metadata.documentId === documentId,
    );
  }

  clear(): void {
    this.store.clear();
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  /**
   * Validates and converts a VectorRecord to a PineconeRecord.
   * Rejects records without tenantId or text — these fields are
   * mandatory for tenant isolation and RAG retrieval.
   */
  private toRecord(vector: VectorRecord): PineconeRecord<VectorMetadata> {
    if (!vector.metadata.tenantId?.trim()) {
      throw new BadRequestException(
        'Vector metadata requires a non-empty tenantId',
      );
    }

    if (!vector.metadata.text?.trim()) {
      throw new BadRequestException(
        'Vector metadata requires non-empty text',
      );
    }

    const metadata: VectorMetadata = {
      tenantId: vector.metadata.tenantId,
      text: vector.metadata.text,
    };

    if (vector.metadata.documentId) {
      metadata.documentId = vector.metadata.documentId;
    }

    if (typeof vector.metadata.chunkIndex === 'number') {
      metadata.chunkIndex = vector.metadata.chunkIndex;
    }

    return {
      id: vector.id,
      values: vector.values,
      metadata,
    };
  }

  /**
   * Central guard: every public method that accepts a tenantId MUST
   * call this first. Prevents empty/blank tenantIds from silently
   * disabling tenant filters.
   */
  private assertTenantId(tenantId: string, method: string): void {
    if (!tenantId?.trim()) {
      throw new BadRequestException(
        `${method} requires a non-empty tenantId`,
      );
    }
  }

  private isConfigured(value: string | undefined): value is string {
    return Boolean(value && value.trim() && !value.includes('your_'));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dot / denominator;
  }
}
