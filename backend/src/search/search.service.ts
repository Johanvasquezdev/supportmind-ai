import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EmbeddingService, RetrievedChunk, VectorService } from '../documents/ingestion';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_LIMIT = 8;
const DEFAULT_VECTOR_WEIGHT = 0.7;
const DEFAULT_KEYWORD_WEIGHT = 0.3;
const DEFAULT_MIN_SCORE = 0.3;
const MAX_LIMIT = 20;

export interface SearchOptions {
  limit?: number;
  vectorWeight?: number;
  keywordWeight?: number;
  minScore?: number;
}

export interface HybridSearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  text: string;
  vectorScore: number;
  keywordScore: number;
  hybridScore: number;
  chunkIndex: number;
}

interface NormalizedSearchOptions {
  limit: number;
  vectorWeight: number;
  keywordWeight: number;
  minScore: number;
}

interface KeywordRow {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  tenantId: string;
  rank: number;
}

interface VectorChunkRow {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  vectorId: string;
  document: {
    title: string | null;
  };
}

interface KeywordSearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  text: string;
  keywordScore: number;
  chunkIndex: number;
}

interface VectorSearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  text: string;
  vectorScore: number;
  chunkIndex: number;
}

type MergeCandidate = Omit<HybridSearchResult, 'hybridScore'>;

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorService: VectorService,
  ) {}

  async hybridSearch(
    query: string,
    tenantId: string,
    options: SearchOptions = {},
  ): Promise<HybridSearchResult[]> {
    const cleanQuery = query.trim();
    const cleanTenantId = tenantId.trim();

    if (!cleanQuery) {
      throw new BadRequestException('query is required');
    }

    if (!cleanTenantId) {
      throw new BadRequestException('tenantId is required');
    }

    const normalizedOptions = this.normalizeOptions(options);
    const expandedLimit = normalizedOptions.limit * 2;
    const startedAt = Date.now();

    const [vectorResults, keywordResults] = await Promise.all([
      this.safeVectorSearch(cleanQuery, cleanTenantId, expandedLimit),
      this.safeKeywordSearch(cleanQuery, cleanTenantId, expandedLimit),
    ]);

    const merged = this.mergeResults(vectorResults, keywordResults, normalizedOptions);

    const dedupedByDocument = this.deduplicateByDocument(merged)
      .filter((result) => result.hybridScore >= normalizedOptions.minScore)
      .slice(0, normalizedOptions.limit);

    this.logger.debug(
      `Hybrid search "${cleanQuery}" tenant=${cleanTenantId}: vector=${vectorResults.length}, keyword=${keywordResults.length}, returned=${dedupedByDocument.length}, total=${Date.now() - startedAt}ms`,
    );

    return dedupedByDocument;
  }

  async suggest(partialQuery: string, tenantId: string): Promise<string[]> {
    const query = partialQuery.trim();
    const cleanTenantId = tenantId.trim();

    if (!query || !cleanTenantId) {
      return [];
    }

    const suggestions = await this.prisma.$queryRaw<{ suggestion: string }[]>`
      SELECT DISTINCT suggestion
      FROM (
        SELECT d.title AS suggestion, 1 AS priority
        FROM "Document" d
        WHERE d."tenantId" = ${cleanTenantId}
          AND d.title IS NOT NULL
          AND d.title ILIKE ${`%${query}%`}

        UNION ALL

        SELECT left(dc.text, 120) AS suggestion, 2 AS priority
        FROM "DocumentChunk" dc
        WHERE dc."tenantId" = ${cleanTenantId}
          AND dc.text ILIKE ${`%${query}%`}
      ) ranked
      WHERE suggestion IS NOT NULL
      GROUP BY suggestion
      ORDER BY min(priority), suggestion
      LIMIT 5
    `;

    return suggestions.map((row) => row.suggestion).filter(Boolean);
  }

  private async safeVectorSearch(
    query: string,
    tenantId: string,
    limit: number,
  ): Promise<VectorSearchResult[]> {
    const startedAt = Date.now();

    try {
      const results = await this.vectorSearch(query, tenantId, limit);
      this.logger.debug(`Vector search returned ${results.length} chunks in ${Date.now() - startedAt}ms`);
      return results;
    } catch (error) {
      this.logger.warn(`Vector search failed, using keyword-only fallback: ${this.toError(error).message}`);
      return [];
    }
  }

  private async safeKeywordSearch(
    query: string,
    tenantId: string,
    limit: number,
  ): Promise<KeywordSearchResult[]> {
    const startedAt = Date.now();

    try {
      const results = await this.keywordSearch(query, tenantId, limit);
      this.logger.debug(`Keyword search returned ${results.length} chunks in ${Date.now() - startedAt}ms`);
      return results;
    } catch (error) {
      this.logger.warn(`Keyword search failed, using vector-only fallback: ${this.toError(error).message}`);
      return [];
    }
  }

  private async vectorSearch(
    query: string,
    tenantId: string,
    limit: number,
  ): Promise<VectorSearchResult[]> {
    const queryEmbedding = await this.embeddingService.embedOne(query);
    const chunks = await this.vectorService.query(queryEmbedding, tenantId, limit);
    const vectorIds = chunks.map((chunk) => chunk.vectorId);

    const chunkRows = vectorIds.length > 0
      ? await this.prisma.documentChunk.findMany({
          where: {
            tenantId,
            vectorId: { in: vectorIds },
          },
          select: {
            id: true,
            documentId: true,
            chunkIndex: true,
            text: true,
            vectorId: true,
            document: {
              select: {
                title: true,
              },
            },
          },
        })
      : [];

    const rowByVectorId = new Map<string, VectorChunkRow>(
      chunkRows.map((row) => [row.vectorId, row]),
    );

    return chunks.flatMap((chunk) =>
      this.toVectorSearchResult(chunk, rowByVectorId.get(chunk.vectorId)),
    );
  }

  private toVectorSearchResult(
    chunk: RetrievedChunk,
    row: VectorChunkRow | undefined,
  ): VectorSearchResult[] {
    const documentId = row?.documentId ?? chunk.metadata.documentId;

    if (!documentId) {
      return [];
    }

    return [{
      chunkId: row?.id ?? chunk.vectorId,
      documentId,
      documentTitle: row?.document.title ?? 'Untitled document',
      text: row?.text ?? chunk.text,
      vectorScore: this.clampScore(chunk.score),
      chunkIndex: row?.chunkIndex ?? chunk.metadata.chunkIndex ?? 0,
    }];
  }

  private async keywordSearch(
    query: string,
    tenantId: string,
    limit: number,
  ): Promise<KeywordSearchResult[]> {
    const rows = await this.prisma.$queryRaw<KeywordRow[]>(Prisma.sql`
      SELECT
        dc.id,
        dc."documentId",
        dc."chunkIndex",
        dc.text,
        dc."tenantId",
        ts_rank(dc.search_vector, plainto_tsquery('english', ${query}))::float AS rank
      FROM "DocumentChunk" dc
      WHERE dc."tenantId" = ${tenantId}
        AND dc.search_vector @@ plainto_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT ${limit}
    `);

    if (rows.length === 0) {
      return [];
    }

    const documentIds = [...new Set(rows.map((row) => row.documentId))];
    const documents = await this.prisma.document.findMany({
      where: {
        tenantId,
        id: { in: documentIds },
      },
      select: {
        id: true,
        title: true,
      },
    });

    const titleByDocumentId = new Map(
      documents.map((document) => [document.id, document.title ?? 'Untitled document']),
    );

    return rows.map((row, index) => ({
      chunkId: row.id,
      documentId: row.documentId,
      documentTitle: titleByDocumentId.get(row.documentId) ?? 'Untitled document',
      text: row.text,
      keywordScore: 1 / (index + 1),
      chunkIndex: row.chunkIndex,
    }));
  }

  private mergeResults(
    vectorResults: VectorSearchResult[],
    keywordResults: KeywordSearchResult[],
    options: NormalizedSearchOptions,
  ): HybridSearchResult[] {
    const startedAt = Date.now();
    const candidates = new Map<string, MergeCandidate>();

    for (const result of vectorResults) {
      candidates.set(result.chunkId, {
        ...result,
        keywordScore: 0,
      });
    }

    for (const result of keywordResults) {
      const existing = candidates.get(result.chunkId);

      candidates.set(result.chunkId, {
        chunkId: result.chunkId,
        documentId: result.documentId,
        documentTitle: result.documentTitle,
        text: result.text,
        vectorScore: existing?.vectorScore ?? 0,
        keywordScore: result.keywordScore,
        chunkIndex: result.chunkIndex,
      });
    }

    const merged = Array.from(candidates.values())
      .map((candidate) => ({
        ...candidate,
        hybridScore: this.clampScore(
          candidate.vectorScore * options.vectorWeight +
          candidate.keywordScore * options.keywordWeight,
        ),
      }))
      .sort((a, b) => b.hybridScore - a.hybridScore);

    this.logger.debug(`Merged hybrid results in ${Date.now() - startedAt}ms`);
    return merged;
  }

  private deduplicateByDocument(results: HybridSearchResult[]): HybridSearchResult[] {
    const byDocumentId = new Map<string, HybridSearchResult>();

    for (const result of results) {
      const existing = byDocumentId.get(result.documentId);

      if (!existing || result.hybridScore > existing.hybridScore) {
        byDocumentId.set(result.documentId, result);
      }
    }

    return Array.from(byDocumentId.values()).sort(
      (a, b) => b.hybridScore - a.hybridScore,
    );
  }

  private normalizeOptions(options: SearchOptions): NormalizedSearchOptions {
    return {
      limit: this.clampLimit(options.limit ?? DEFAULT_LIMIT),
      vectorWeight: this.normalizeWeight(options.vectorWeight ?? DEFAULT_VECTOR_WEIGHT),
      keywordWeight: this.normalizeWeight(options.keywordWeight ?? DEFAULT_KEYWORD_WEIGHT),
      minScore: this.clampScore(options.minScore ?? DEFAULT_MIN_SCORE),
    };
  }

  private clampLimit(limit: number): number {
    if (!Number.isFinite(limit)) {
      return DEFAULT_LIMIT;
    }

    return Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
  }

  private normalizeWeight(weight: number): number {
    if (!Number.isFinite(weight)) {
      return 0;
    }

    return Math.min(1, Math.max(0, weight));
  }

  private clampScore(score: number): number {
    if (!Number.isFinite(score)) {
      return 0;
    }

    return Math.min(1, Math.max(0, score));
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }
}
