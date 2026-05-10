import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

// ─── Model configuration ────────────────────────────────────────────────────
// text-embedding-3-small:  1536 dimensions, $0.02 / 1M tokens
// text-embedding-3-large:  3072 dimensions, $0.13 / 1M tokens
// We default to "small" — good balance of cost, speed, and quality.
const DEFAULT_MODEL = 'gemini-embedding-2';
const DEFAULT_DIMENSIONS = 768;

// OpenAI accepts up to 2048 inputs per request, but smaller batches are
// safer against timeouts and rate limits.
const MAX_BATCH_SIZE = 100;

// Simple exponential-backoff retry for transient 429 / 5xx errors.
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

export interface EmbeddingResult {
  /** The input text that was embedded. */
  text: string;
  /** The dense vector representation (float[]). */
  vector: number[];
  /** Dimensionality of the vector. */
  dimensions: number;
  /** Model used to generate the embedding. */
  model: string;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly openai: OpenAI;
  readonly model: string;
  readonly dimensions: number;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
    });
    this.model = this.config.get<string>('EMBEDDING_MODEL') ?? DEFAULT_MODEL;
    const envDim = this.config.get('EMBEDDING_DIMENSIONS');
    this.dimensions = envDim ? parseInt(String(envDim), 10) : DEFAULT_DIMENSIONS;
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Embed multiple texts in batches.
   * Returns raw vectors in the same order as the input texts.
   */
  async embedMany(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const allVectors: number[][] = [];

    for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
      const batch = texts.slice(i, i + MAX_BATCH_SIZE);
      const vectors = await this.callWithRetry(batch);
      allVectors.push(...vectors);
    }

    if (allVectors.length !== texts.length) {
      throw new InternalServerErrorException(
        `Embedding count mismatch: expected ${texts.length}, got ${allVectors.length}`,
      );
    }

    return allVectors;
  }

  /**
   * Embed a single text string.
   */
  async embedOne(text: string): Promise<number[]> {
    const [vector] = await this.embedMany([text]);
    return vector;
  }

  /**
   * Embed texts and return rich EmbeddingResult objects containing the
   * vector, source text, model, and dimensionality metadata.
   *
   * This is the primary method used by the ingestion pipeline.
   */
  async embedWithMetadata(texts: string[]): Promise<EmbeddingResult[]> {
    const vectors = await this.embedMany(texts);

    return texts.map((text, i) => ({
      text,
      vector: vectors[i],
      dimensions: this.dimensions,
      model: this.model,
    }));
  }

  // ─── Internals ───────────────────────────────────────────────────────────

  /**
   * Calls the OpenAI embeddings endpoint with simple exponential-backoff
   * retry for transient failures (429, 500, 502, 503).
   */
  private async callWithRetry(batch: string[]): Promise<number[][]> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: batch,
          dimensions: this.dimensions,
        });

        // Sort by index to guarantee order matches input
        return response.data
          .sort((a, b) => a.index - b.index)
          .map((d) => d.embedding);
      } catch (err: any) {
        lastError = err;
        const status = err?.status ?? err?.response?.status;
        const isRetryable = [429, 500, 502, 503].includes(status);

        if (!isRetryable || attempt === MAX_RETRIES) {
          this.logger.error(
            `OpenAI embedding failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`,
          );
          throw err;
        }

        const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
        this.logger.warn(
          `OpenAI embedding attempt ${attempt} failed (${status}), retrying in ${delayMs}ms…`,
        );
        await this.sleep(delayMs);
      }
    }

    // Should never reach here, but satisfies TypeScript
    throw lastError ?? new InternalServerErrorException('Embedding failed');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
