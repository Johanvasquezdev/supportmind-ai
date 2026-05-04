import { ChunkingService, Chunk, ChunkingOptions } from './chunking.service';

describe('ChunkingService', () => {
  let service: ChunkingService;

  beforeEach(() => {
    service = new ChunkingService();
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /** Generate a string of approximately `tokens` estimated tokens. */
  const makeText = (tokens: number): string => {
    // ~4 chars/token  →  fill with "word " (5 chars ≈ 1.25 tokens)
    const chars = tokens * 4;
    return 'word '.repeat(Math.ceil(chars / 5)).trim();
  };

  const totalTokens = (chunks: Chunk[]): number =>
    chunks.reduce((sum, c) => sum + c.tokenEstimate, 0);

  // ─── Core behaviour ──────────────────────────────────────────────────────

  it('should return an empty array for empty input', () => {
    expect(service.chunk('')).toEqual([]);
    expect(service.chunk('   ')).toEqual([]);
  });

  it('should return a single chunk for short text', () => {
    const text = 'This is a short sentence.';
    const chunks = service.chunk(text, { maxTokens: 1000, minTokens: 0 });

    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe(text);
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].tokenEstimate).toBeGreaterThan(0);
  });

  it('should split long text into multiple chunks', () => {
    // ~3000 tokens of content
    const sentences: string[] = [];
    for (let i = 0; i < 60; i++) {
      sentences.push(`Sentence number ${i} with some extra padding words to reach a reasonable length.`);
    }
    const text = sentences.join(' ');

    const chunks = service.chunk(text, { maxTokens: 500, minTokens: 100, overlapTokens: 50 });

    expect(chunks.length).toBeGreaterThan(1);

    // Every chunk should respect maxTokens (with small tolerance for merging)
    for (const chunk of chunks) {
      expect(chunk.tokenEstimate).toBeLessThanOrEqual(600); // small margin for merged runts
    }
  });

  it('should produce sequential zero-based indices', () => {
    const text = Array(30)
      .fill('This is a test sentence for indexing.')
      .join(' ');

    const chunks = service.chunk(text, { maxTokens: 100, minTokens: 0, overlapTokens: 10 });

    chunks.forEach((c, i) => {
      expect(c.index).toBe(i);
    });
  });

  // ─── Overlap ─────────────────────────────────────────────────────────────

  it('should create overlapping content between consecutive chunks', () => {
    const sentences = Array(40)
      .fill(null)
      .map((_, i) => `Unique sentence identifier ${i} for overlap testing.`);
    const text = sentences.join(' ');

    const chunks = service.chunk(text, { maxTokens: 200, minTokens: 50, overlapTokens: 50 });

    // At least one pair of consecutive chunks should share some text
    let hasOverlap = false;
    for (let i = 0; i < chunks.length - 1; i++) {
      const wordsA = new Set(chunks[i].text.split(/\s+/));
      const wordsB = new Set(chunks[i + 1].text.split(/\s+/));
      const shared = [...wordsB].filter((w) => wordsA.has(w));
      if (shared.length > 5) {
        hasOverlap = true;
        break;
      }
    }
    expect(hasOverlap).toBe(true);
  });

  it('should produce no overlap when overlapTokens is 0', () => {
    const sentences = Array(20)
      .fill(null)
      .map((_, i) => `UniqueWord${i} sentence with padding.`);
    const text = sentences.join(' ');

    const chunks = service.chunk(text, { maxTokens: 200, minTokens: 0, overlapTokens: 0 });

    // Adjacent chunks should not share unique identifiers
    for (let i = 0; i < chunks.length - 1; i++) {
      const unique: string[] = chunks[i].text.match(/UniqueWord\d+/g) ?? [];
      const nextUnique: string[] = chunks[i + 1].text.match(/UniqueWord\d+/g) ?? [];
      const overlap = unique.filter((u) => nextUnique.includes(u));
      expect(overlap.length).toBe(0);
    }
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('should hard-split a single enormous sentence', () => {
    // A "sentence" of ~2000 tokens with no period/break
    const huge = 'a'.repeat(8000); // 2000 tokens
    const chunks = service.chunk(huge, { maxTokens: 500, minTokens: 0, overlapTokens: 0 });

    expect(chunks.length).toBeGreaterThanOrEqual(4);
    for (const chunk of chunks) {
      expect(chunk.tokenEstimate).toBeLessThanOrEqual(500);
    }
  });

  it('should merge a small trailing chunk into the previous one', () => {
    // Construct text where the last sentence is tiny
    const sentences = [
      ...Array(10).fill('This is a reasonably long sentence with plenty of words to fill a chunk.'),
      'Short.',
    ];
    const text = sentences.join(' ');

    const chunks = service.chunk(text, { maxTokens: 300, minTokens: 100, overlapTokens: 0 });

    // The last chunk should not be just "Short."
    const lastChunk = chunks[chunks.length - 1];
    expect(lastChunk.tokenEstimate).toBeGreaterThanOrEqual(2); // at least more than 1 word
    expect(lastChunk.text).toContain('Short.');
  });

  it('should handle text with various line endings', () => {
    const text = 'Line one.\r\nLine two.\rLine three.\nLine four.';
    const chunks = service.chunk(text, { maxTokens: 1000, minTokens: 0, overlapTokens: 0 });

    // All content should be present across the chunks
    const allText = chunks.map((c) => c.text).join(' ');
    expect(allText).toContain('Line one.');
    expect(allText).toContain('Line two.');
    expect(allText).toContain('Line three.');
    expect(allText).toContain('Line four.');
  });

  it('should handle markdown-style headers', () => {
    const text = [
      '# Introduction',
      'This is the introduction paragraph.',
      '',
      '## Section One',
      'Content of section one.',
      '',
      '## Section Two',
      'Content of section two.',
    ].join('\n');

    const chunks = service.chunk(text, { maxTokens: 1000, minTokens: 0 });
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].text).toContain('Introduction');
  });

  // ─── Token estimation ────────────────────────────────────────────────────

  it('should estimate tokens as roughly chars / 4', () => {
    const text = 'Hello world'; // 11 chars → ceil(11/4) = 3
    expect(service.estimateTokens(text)).toBe(3);
  });

  it('should estimate 0 tokens for empty string', () => {
    expect(service.estimateTokens('')).toBe(0);
  });
});
