import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_MODEL = 'gemini-embedding-001';
const DEFAULT_DIMENSIONS = 768;
const MAX_BATCH_SIZE = 100;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const GEMINI_EMBEDDING_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface EmbeddingResult {
  text: string;
  vector: number[];
  dimensions: number;
  model: string;
}

interface GeminiEmbeddingResponse {
  embedding?: {
    values?: number[];
  };
}

interface ApiErrorShape {
  status?: number;
  response?: {
    status?: number;
  };
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey: string;
  readonly model: string;
  readonly dimensions: number;

  constructor(private readonly config: ConfigService) {
    const apiKey =
      this.config.get<string>('GEMINI_API_KEY') ??
      this.config.get<string>('GOOGLE_AI_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY is required for document embeddings',
      );
    }

    const envDimensions = this.config.get<string | number>('EMBEDDING_DIMENSIONS');

    this.apiKey = apiKey;
    this.model = this.config.get<string>('EMBEDDING_MODEL') ?? DEFAULT_MODEL;
    this.dimensions = Number(envDimensions ?? DEFAULT_DIMENSIONS);
  }

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

  async embedOne(text: string): Promise<number[]> {
    const [vector] = await this.embedMany([text]);
    return vector;
  }

  async embedWithMetadata(texts: string[]): Promise<EmbeddingResult[]> {
    const vectors = await this.embedMany(texts);

    return texts.map((text, index) => ({
      text,
      vector: vectors[index],
      dimensions: this.dimensions,
      model: this.model,
    }));
  }

  private async callWithRetry(batch: string[]): Promise<number[][]> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const vectors: number[][] = [];

        for (const text of batch) {
          vectors.push(await this.embedText(text));
        }

        return vectors;
      } catch (error) {
        const err = this.toError(error);
        lastError = err;
        const status = this.getStatus(error);
        const isRetryable = [429, 500, 502, 503].includes(status ?? 0);

        if (!isRetryable || attempt === MAX_RETRIES) {
          this.logger.error(
            `Gemini embedding failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`,
          );
          throw err;
        }

        const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
        this.logger.warn(
          `Gemini embedding attempt ${attempt} failed (${status}), retrying in ${delayMs}ms`,
        );
        await this.sleep(delayMs);
      }
    }

    throw lastError ?? new InternalServerErrorException('Embedding failed');
  }

  private async embedText(text: string): Promise<number[]> {
    const response = await fetch(
      `${GEMINI_EMBEDDING_BASE_URL}/${this.model}:embedContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: {
            parts: [{ text }],
          },
          outputDimensionality: this.dimensions,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      const error = new Error(body || response.statusText);
      (error as ApiErrorShape).status = response.status;
      throw error;
    }

    const body = (await response.json()) as GeminiEmbeddingResponse;
    const vector = body.embedding?.values;

    if (!vector || vector.length === 0) {
      throw new InternalServerErrorException('Gemini returned an empty embedding');
    }

    return vector;
  }

  private getStatus(error: unknown): number | undefined {
    const shaped = error as ApiErrorShape;
    return shaped.status ?? shaped.response?.status;
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
