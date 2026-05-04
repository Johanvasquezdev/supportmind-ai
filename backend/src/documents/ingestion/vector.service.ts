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

  async upsert(vectors: VectorRecord[]): Promise<void> {
    const records = vectors.map((vector) => this.toRecord(vector));

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

  async query(
    values: number[],
    tenantId: string,
    topK = 5,
  ): Promise<RetrievedChunk[]> {
    if (this.index) {
      const response = await this.index.query({
        vector: values,
        topK,
        includeMetadata: true,
        filter: {
          tenantId: { $eq: tenantId },
        },
      });

      return response.matches.map((match) => {
        const metadata = match.metadata;

        return {
          vectorId: match.id,
          score: match.score ?? 0,
          text: metadata?.text ?? '',
          metadata: metadata ?? { tenantId, text: '' },
        };
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

  async deleteByDocument(tenantId: string, documentId: string): Promise<void> {
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

  get size(): number {
    return this.store.size;
  }

  getByTenant(tenantId: string): VectorRecord[] {
    return Array.from(this.store.values()).filter(
      (record) => record.metadata.tenantId === tenantId,
    );
  }

  getByDocument(documentId: string): VectorRecord[] {
    return Array.from(this.store.values()).filter(
      (record) => record.metadata.documentId === documentId,
    );
  }

  clear(): void {
    this.store.clear();
  }

  private toRecord(vector: VectorRecord): PineconeRecord<VectorMetadata> {
    if (!vector.metadata.tenantId || !vector.metadata.text) {
      throw new BadRequestException('Vector metadata requires tenantId and text');
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
