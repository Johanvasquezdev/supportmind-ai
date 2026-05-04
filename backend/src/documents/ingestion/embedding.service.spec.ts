import { ConfigService } from '@nestjs/config';
import { EmbeddingService, EmbeddingResult } from './embedding.service';

// ─── Mock OpenAI ─────────────────────────────────────────────────────────────
// We mock the OpenAI SDK so tests run without a real API key, instantly,
// and deterministically. The mock returns a fake 1536-d vector where
// each element is the index position / 1536 (makes vectors distinguishable).

const createMockEmbedding = (index: number, dims: number): number[] =>
  Array.from({ length: dims }, (_, d) => (index + d) / dims);

const mockOpenAICreate = jest.fn();

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: mockOpenAICreate,
      },
    })),
  };
});

// ─── Mock ConfigService ──────────────────────────────────────────────────────
const mockConfig = {
  getOrThrow: jest.fn((key: string) => {
    if (key === 'OPENAI_API_KEY') return 'test-key-123';
    throw new Error(`Missing config: ${key}`);
  }),
  get: jest.fn((key: string) => {
    if (key === 'EMBEDDING_MODEL') return 'text-embedding-3-small';
    if (key === 'EMBEDDING_DIMENSIONS') return 1536;
    return undefined;
  }),
} as unknown as ConfigService;

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmbeddingService(mockConfig);

    // Default: successful embedding response
    mockOpenAICreate.mockImplementation(async ({ input }: any) => {
      const texts: string[] = Array.isArray(input) ? input : [input];
      return {
        data: texts.map((_, i) => ({
          index: i,
          embedding: createMockEmbedding(i, 1536),
        })),
        model: 'text-embedding-3-small',
        usage: { prompt_tokens: texts.length * 10, total_tokens: texts.length * 10 },
      };
    });
  });

  // ─── embedMany ───────────────────────────────────────────────────────────

  describe('embedMany', () => {
    it('should return an empty array for empty input', async () => {
      const result = await service.embedMany([]);
      expect(result).toEqual([]);
      expect(mockOpenAICreate).not.toHaveBeenCalled();
    });

    it('should return one vector per input text', async () => {
      const texts = ['Hello world', 'How are you?', 'Goodbye'];
      const vectors = await service.embedMany(texts);

      expect(vectors).toHaveLength(3);
      expect(mockOpenAICreate).toHaveBeenCalledTimes(1);
    });

    it('should return vectors with correct dimensions', async () => {
      const vectors = await service.embedMany(['test text']);

      expect(vectors[0]).toHaveLength(1536);
      expect(typeof vectors[0][0]).toBe('number');
    });

    it('should pass correct model and dimensions to OpenAI', async () => {
      await service.embedMany(['test']);

      expect(mockOpenAICreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: ['test'],
        dimensions: 1536,
      });
    });

    it('should batch inputs when exceeding MAX_BATCH_SIZE', async () => {
      // Generate 250 texts → should trigger 3 batches (100 + 100 + 50)
      const texts = Array.from({ length: 250 }, (_, i) => `text ${i}`);
      const vectors = await service.embedMany(texts);

      expect(vectors).toHaveLength(250);
      expect(mockOpenAICreate).toHaveBeenCalledTimes(3);
    });

    it('should sort response by index to maintain input order', async () => {
      // Return embeddings in reverse order
      mockOpenAICreate.mockImplementationOnce(async ({ input }: any) => {
        const texts: string[] = Array.isArray(input) ? input : [input];
        return {
          data: texts
            .map((_, i) => ({
              index: i,
              embedding: createMockEmbedding(i, 1536),
            }))
            .reverse(), // shuffled!
        };
      });

      const vectors = await service.embedMany(['a', 'b', 'c']);

      // First vector should be the one for index 0
      expect(vectors[0][0]).toBeCloseTo(0 / 1536, 5);
      expect(vectors[1][0]).toBeCloseTo(1 / 1536, 5);
    });

    it('should throw if response count does not match input count', async () => {
      mockOpenAICreate.mockImplementationOnce(async () => ({
        data: [{ index: 0, embedding: createMockEmbedding(0, 1536) }],
      }));

      await expect(service.embedMany(['a', 'b'])).rejects.toThrow(
        'Embedding count mismatch',
      );
    });
  });

  // ─── embedOne ────────────────────────────────────────────────────────────

  describe('embedOne', () => {
    it('should return a single vector', async () => {
      const vector = await service.embedOne('hello');

      expect(vector).toHaveLength(1536);
      expect(mockOpenAICreate).toHaveBeenCalledTimes(1);
    });
  });

  // ─── embedWithMetadata ───────────────────────────────────────────────────

  describe('embedWithMetadata', () => {
    it('should return EmbeddingResult objects with vector, text, model, and dimensions', async () => {
      const texts = ['Hello world', 'Goodbye'];
      const results: EmbeddingResult[] = await service.embedWithMetadata(texts);

      expect(results).toHaveLength(2);

      expect(results[0].text).toBe('Hello world');
      expect(results[0].vector).toHaveLength(1536);
      expect(results[0].model).toBe('text-embedding-3-small');
      expect(results[0].dimensions).toBe(1536);

      expect(results[1].text).toBe('Goodbye');
    });

    it('should preserve text-to-vector mapping across batches', async () => {
      const texts = Array.from({ length: 150 }, (_, i) => `sentence ${i}`);
      const results = await service.embedWithMetadata(texts);

      expect(results).toHaveLength(150);
      results.forEach((r, i) => {
        expect(r.text).toBe(`sentence ${i}`);
        expect(r.vector).toHaveLength(1536);
      });
    });
  });

  // ─── Retry logic ─────────────────────────────────────────────────────────

  describe('retry', () => {
    it('should retry on 429 (rate limit) and succeed', async () => {
      const rateLimitError = new Error('Rate limited');
      (rateLimitError as any).status = 429;

      mockOpenAICreate
        .mockRejectedValueOnce(rateLimitError)
        .mockImplementationOnce(async ({ input }: any) => ({
          data: [{ index: 0, embedding: createMockEmbedding(0, 1536) }],
        }));

      const vectors = await service.embedMany(['test']);
      expect(vectors).toHaveLength(1);
      expect(mockOpenAICreate).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 400 (client error)', async () => {
      const clientError = new Error('Bad request');
      (clientError as any).status = 400;

      mockOpenAICreate.mockRejectedValue(clientError);

      await expect(service.embedMany(['test'])).rejects.toThrow('Bad request');
      expect(mockOpenAICreate).toHaveBeenCalledTimes(1);
    });

    it('should throw after MAX_RETRIES exhausted', async () => {
      const serverError = new Error('Server error');
      (serverError as any).status = 500;

      mockOpenAICreate.mockRejectedValue(serverError);

      await expect(service.embedMany(['test'])).rejects.toThrow('Server error');
      expect(mockOpenAICreate).toHaveBeenCalledTimes(3); // MAX_RETRIES = 3
    });
  });

  // ─── Configuration ──────────────────────────────────────────────────────

  describe('configuration', () => {
    it('should expose model and dimensions', () => {
      expect(service.model).toBe('text-embedding-3-small');
      expect(service.dimensions).toBe(1536);
    });
  });
});
