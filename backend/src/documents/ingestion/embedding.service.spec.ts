import { ConfigService } from '@nestjs/config';
import { EmbeddingResult, EmbeddingService } from './embedding.service';

const createMockEmbedding = (index: number, dims: number): number[] =>
  Array.from({ length: dims }, (_, dimension) => (index + dimension) / dims);

const mockFetch = jest.fn();

const mockConfig = {
  get: jest.fn((key: string) => {
    if (key === 'GEMINI_API_KEY') return 'test-gemini-key';
    if (key === 'EMBEDDING_MODEL') return 'gemini-embedding-001';
    if (key === 'EMBEDDING_DIMENSIONS') return 768;
    return undefined;
  }),
} as unknown as ConfigService;

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let requestIndex: number;

  beforeEach(() => {
    jest.clearAllMocks();
    requestIndex = 0;
    global.fetch = mockFetch;
    service = new EmbeddingService(mockConfig);

    mockFetch.mockImplementation(async () => {
      const vector = createMockEmbedding(requestIndex, 768);
      requestIndex += 1;

      return {
        ok: true,
        json: async () => ({
          embedding: {
            values: vector,
          },
        }),
      };
    });
  });

  describe('embedMany', () => {
    it('returns an empty array for empty input', async () => {
      const result = await service.embedMany([]);

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns one vector per input text', async () => {
      const texts = ['Hello world', 'How are you?', 'Goodbye'];
      const vectors = await service.embedMany(texts);

      expect(vectors).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('returns vectors with the configured Gemini dimensions', async () => {
      const vectors = await service.embedMany(['test text']);

      expect(vectors[0]).toHaveLength(768);
      expect(typeof vectors[0][0]).toBe('number');
    });

    it('calls the Gemini embedding endpoint with model, text, and dimensions', async () => {
      await service.embedMany(['test']);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/gemini-embedding-001:embedContent?key=test-gemini-key'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            content: {
              parts: [{ text: 'test' }],
            },
            outputDimensionality: 768,
          }),
        }),
      );
    });

    it('batches inputs when exceeding MAX_BATCH_SIZE', async () => {
      const texts = Array.from({ length: 250 }, (_, index) => `text ${index}`);
      const vectors = await service.embedMany(texts);

      expect(vectors).toHaveLength(250);
      expect(mockFetch).toHaveBeenCalledTimes(250);
    });

    it('throws if Gemini returns an empty embedding', async () => {
      mockFetch.mockReset();
      mockFetch.mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          embedding: {
            values: [],
          },
        }),
      }));

      await expect(service.embedMany(['a'])).rejects.toThrow(
        'Gemini returned an empty embedding',
      );
    });
  });

  describe('embedOne', () => {
    it('returns a single vector', async () => {
      const vector = await service.embedOne('hello');

      expect(vector).toHaveLength(768);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('embedWithMetadata', () => {
    it('returns EmbeddingResult objects with vector, text, model, and dimensions', async () => {
      const texts = ['Hello world', 'Goodbye'];
      const results: EmbeddingResult[] = await service.embedWithMetadata(texts);

      expect(results).toHaveLength(2);
      expect(results[0].text).toBe('Hello world');
      expect(results[0].vector).toHaveLength(768);
      expect(results[0].model).toBe('gemini-embedding-001');
      expect(results[0].dimensions).toBe(768);
      expect(results[1].text).toBe('Goodbye');
    });

    it('preserves text-to-vector mapping across batches', async () => {
      const texts = Array.from({ length: 150 }, (_, index) => `sentence ${index}`);
      const results = await service.embedWithMetadata(texts);

      expect(results).toHaveLength(150);
      results.forEach((result, index) => {
        expect(result.text).toBe(`sentence ${index}`);
        expect(result.vector).toHaveLength(768);
      });
    });
  });

  describe('retry', () => {
    it('retries on 429 and succeeds', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Rate limited',
          text: async () => 'Rate limited',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            embedding: {
              values: createMockEmbedding(0, 768),
            },
          }),
        });

      const vectors = await service.embedMany(['test']);

      expect(vectors).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('does not retry on 400', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad request',
        text: async () => 'Bad request',
      });

      await expect(service.embedMany(['test'])).rejects.toThrow('Bad request');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws after MAX_RETRIES is exhausted', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server error',
        text: async () => 'Server error',
      });

      await expect(service.embedMany(['test'])).rejects.toThrow('Server error');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('configuration', () => {
    it('exposes model and dimensions', () => {
      expect(service.model).toBe('gemini-embedding-001');
      expect(service.dimensions).toBe(768);
    });
  });
});
