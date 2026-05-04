import { Injectable, Logger } from '@nestjs/common';

// ─── Token estimation ────────────────────────────────────────────────────────
// GPT-family models average ~4 characters per token for English text.
// This heuristic avoids pulling in a full tiktoken dependency at runtime.
const CHARS_PER_TOKEN = 4;

// ─── Defaults (configurable per call) ────────────────────────────────────────
const DEFAULT_MIN_CHUNK_TOKENS = 500;
const DEFAULT_MAX_CHUNK_TOKENS = 1000;
const DEFAULT_OVERLAP_TOKENS = 100;

export interface ChunkingOptions {
  /** Minimum tokens per chunk — helps avoid tiny trailing fragments. */
  minTokens?: number;
  /** Target upper bound for a single chunk. */
  maxTokens?: number;
  /** Overlap between consecutive chunks for context continuity. */
  overlapTokens?: number;
}

export interface Chunk {
  /** Zero-based index among all chunks for this document. */
  index: number;
  /** The chunk text. */
  text: string;
  /** Estimated token count. */
  tokenEstimate: number;
}

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Splits plain text into overlapping, sentence-aware chunks whose sizes
   * fall within [minTokens, maxTokens] (best-effort).
   *
   * Algorithm
   * ---------
   * 1. Split the document into sentences.
   * 2. Greedily accumulate sentences into a chunk until adding the next
   *    sentence would exceed `maxTokens`.
   * 3. Emit the chunk, then back up by `overlapTokens` worth of sentences
   *    to start the next chunk — preserving cross-chunk context.
   * 4. If a single sentence exceeds `maxTokens`, fall back to a hard
   *    character split so no content is ever dropped.
   */
  chunk(text: string, options: ChunkingOptions = {}): Chunk[] {
    const minTokens = options.minTokens ?? DEFAULT_MIN_CHUNK_TOKENS;
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_CHUNK_TOKENS;
    const overlapTokens = options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS;

    const sentences = this.splitSentences(text);
    if (sentences.length === 0) return [];

    const chunks: Chunk[] = [];
    let cursor = 0; // index into sentences[]

    while (cursor < sentences.length) {
      let chunkTokens = 0;
      const chunkSentences: string[] = [];
      let end = cursor; // will point past the last consumed sentence

      // ── Accumulate sentences up to maxTokens ──────────────────────────
      while (end < sentences.length) {
        const sentTokens = this.estimateTokens(sentences[end]);

        // Single sentence exceeds limit → hard-split it
        if (sentTokens > maxTokens && chunkSentences.length === 0) {
          const hardChunks = this.hardSplit(sentences[end], maxTokens);
          for (const hc of hardChunks) {
            chunks.push({
              index: chunks.length,
              text: hc,
              tokenEstimate: this.estimateTokens(hc),
            });
          }
          end++;
          break;
        }

        if (chunkTokens + sentTokens > maxTokens) break;

        chunkSentences.push(sentences[end]);
        chunkTokens += sentTokens;
        end++;
      }

      if (chunkSentences.length > 0) {
        const chunkText = chunkSentences.join(' ').trim();
        if (chunkText.length > 0) {
          chunks.push({
            index: chunks.length,
            text: chunkText,
            tokenEstimate: chunkTokens,
          });
        }
      }

      // ── Advance cursor (with overlap) ─────────────────────────────────
      // `end` is the index of the first unconsumed sentence.
      // Rewind from `end` to create overlap, but NEVER go back to `cursor`
      // or earlier — that would cause an infinite loop.
      const overlapStart = this.rewindForOverlap(sentences, end, overlapTokens);
      const nextCursor = Math.max(overlapStart, cursor + 1);
      cursor = Math.min(nextCursor, end); // can't skip past unconsumed
      // Final safety: if nothing advanced, force progress
      if (cursor <= (chunks.length > 1 ? cursor - 1 : -1)) {
        cursor = end;
      }
    }

    // Merge trailing runt into the previous chunk
    if (chunks.length >= 2) {
      const last = chunks[chunks.length - 1];
      if (last.tokenEstimate < minTokens) {
        const prev = chunks[chunks.length - 2];
        prev.text = `${prev.text} ${last.text}`.trim();
        prev.tokenEstimate = this.estimateTokens(prev.text);
        chunks.pop();
      }
    }

    // Reindex
    chunks.forEach((c, idx) => (c.index = idx));

    this.logger.debug(
      `Chunked ${text.length} chars → ${chunks.length} chunks ` +
        `(target ${minTokens}–${maxTokens} tokens, overlap ${overlapTokens})`,
    );

    return chunks;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /** Rough token estimate: chars / CHARS_PER_TOKEN, rounded up. */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / CHARS_PER_TOKEN);
  }

  /**
   * Sentence splitter.
   * Handles: period/exclamation/question followed by whitespace,
   * newline boundaries, and markdown headers.
   * Keeps abbreviations (e.g., "U.S.A.") together by requiring
   * the character after the period to be uppercase or a newline.
   */
  private splitSentences(text: string): string[] {
    // Normalise line endings
    const normalised = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Split on paragraph boundaries first
    const paragraphs = normalised.split(/\n{2,}/);

    const sentences: string[] = [];

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Split on sentence-ending punctuation followed by space + uppercase,
      // or on single newlines.
      const parts = trimmed.split(/(?<=[.!?])\s+(?=[A-Z])|\n/);
      for (const part of parts) {
        const s = part.trim();
        if (s.length > 0) sentences.push(s);
      }
    }

    return sentences;
  }

  /**
   * Given a forward cursor `end` (exclusive), walk backward through
   * sentences to find the start position that creates an overlap of
   * approximately `overlapTokens`.
   */
  private rewindForOverlap(
    sentences: string[],
    end: number,
    overlapTokens: number,
  ): number {
    if (overlapTokens <= 0 || end <= 0) return end;

    let tokens = 0;
    let pos = end;

    while (pos > 0) {
      pos--;
      tokens += this.estimateTokens(sentences[pos]);
      if (tokens >= overlapTokens) break;
    }

    return pos;
  }

  /**
   * Last-resort: splits a single enormous sentence into hard character
   * slices of at most `maxTokens` estimated tokens each.
   */
  private hardSplit(text: string, maxTokens: number): string[] {
    const maxChars = maxTokens * CHARS_PER_TOKEN;
    const parts: string[] = [];

    for (let i = 0; i < text.length; i += maxChars) {
      const slice = text.slice(i, i + maxChars).trim();
      if (slice.length > 0) parts.push(slice);
    }

    return parts;
  }
}
