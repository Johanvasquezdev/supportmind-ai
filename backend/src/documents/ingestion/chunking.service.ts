import { Injectable, Logger } from '@nestjs/common';

// ─── Token estimation ────────────────────────────────────────────────────────
// GPT-family models average ~4 characters per token for English text.
// This heuristic avoids pulling in a full tiktoken dependency at runtime.
const CHARS_PER_TOKEN = 4;

// ─── Production defaults ─────────────────────────────────────────────────────
// 500–1000 tokens is the sweet spot for RAG retrieval:
//   - Large enough to contain a complete thought or policy paragraph
//   - Small enough for the embedding model to produce a focused vector
//   - Fits comfortably in a GPT-4o context window (even with 5 chunks)
const DEFAULT_MIN_CHUNK_TOKENS = 500;
const DEFAULT_MAX_CHUNK_TOKENS = 1000;

// 150 tokens of overlap (~2–3 sentences) ensures that sentences near chunk
// boundaries are fully represented in at least one chunk's embedding.
// Without overlap, a question about content right at a boundary would
// produce a weak match in both adjacent chunks instead of a strong match
// in at least one.
const DEFAULT_OVERLAP_TOKENS = 150;

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
   * The algorithm preserves semantic meaning through three mechanisms:
   *
   * 1. **Section awareness** — Markdown headers (# / ## / ###) are treated
   *    as hard boundaries. A new section always starts a new chunk, so
   *    related content stays together.
   *
   * 2. **Sentence-level boundaries** — Within sections, the splitter never
   *    cuts mid-sentence. It accumulates whole sentences until the chunk
   *    fills up, then starts a new one.
   *
   * 3. **Overlap** — The last ~overlapTokens of each chunk are repeated at
   *    the start of the next. This ensures sentences near boundaries are
   *    fully captured by at least one chunk's embedding vector.
   */
  chunk(text: string, options: ChunkingOptions = {}): Chunk[] {
    const minTokens = options.minTokens ?? DEFAULT_MIN_CHUNK_TOKENS;
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_CHUNK_TOKENS;
    const overlapTokens = options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS;

    const segments = this.splitIntoSegments(text);
    if (segments.length === 0) return [];

    const chunks: Chunk[] = [];
    let cursor = 0;

    while (cursor < segments.length) {
      let chunkTokens = 0;
      const chunkSegments: string[] = [];
      let end = cursor;

      // ── Accumulate segments up to maxTokens ──────────────────────────
      while (end < segments.length) {
        const seg = segments[end];
        const segTokens = this.estimateTokens(seg);

        // A section header always starts a new chunk (unless the current
        // chunk is empty — then we include it as the chunk opener).
        if (this.isSectionHeader(seg) && chunkSegments.length > 0) {
          break;
        }

        // Single segment exceeds limit → hard-split it
        if (segTokens > maxTokens && chunkSegments.length === 0) {
          const hardChunks = this.hardSplit(seg, maxTokens);
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

        if (chunkTokens + segTokens > maxTokens) break;

        chunkSegments.push(seg);
        chunkTokens += segTokens;
        end++;
      }

      if (chunkSegments.length > 0) {
        const chunkText = chunkSegments.join(' ').trim();
        if (chunkText.length > 0) {
          chunks.push({
            index: chunks.length,
            text: chunkText,
            tokenEstimate: this.estimateTokens(chunkText),
          });
        }
      }

      // ── Advance cursor (with overlap) ─────────────────────────────────
      // Rewind from `end` to create overlap, but NEVER go back to `cursor`
      // or earlier — that would cause an infinite loop.
      //
      // Skip overlap if the next segment is a section header — sections
      // represent topic changes, so carrying context from the previous
      // topic would hurt rather than help retrieval.
      const nextIsSectionBreak =
        end < segments.length && this.isSectionHeader(segments[end]);

      if (nextIsSectionBreak || overlapTokens <= 0) {
        cursor = end;
      } else {
        const overlapStart = this.rewindForOverlap(segments, end, overlapTokens);
        const nextCursor = Math.max(overlapStart, cursor + 1);
        cursor = Math.min(nextCursor, end);
      }

      // Safety: guarantee forward progress
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
   * Splits text into "segments" — the atomic units of chunking.
   *
   * A segment is either:
   *   - A markdown section header (e.g. "# Introduction")
   *   - A single sentence
   *
   * Headers are kept as separate segments so the chunker can use them
   * as natural break points between topics.
   */
  private splitIntoSegments(text: string): string[] {
    // Normalise line endings
    const normalised = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Split on paragraph boundaries (double newline)
    const paragraphs = normalised.split(/\n{2,}/);

    const segments: string[] = [];

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Check if the paragraph is a markdown header
      if (this.isSectionHeader(trimmed)) {
        segments.push(trimmed);
        continue;
      }

      // Split into sentences within the paragraph
      const sentences = this.splitSentences(trimmed);
      segments.push(...sentences);
    }

    return segments;
  }

  /**
   * Returns true if the text is a markdown section header (# / ## / ### etc).
   */
  private isSectionHeader(text: string): boolean {
    return /^#{1,6}\s/.test(text);
  }

  /**
   * Sentence splitter.
   * Handles: period/exclamation/question followed by whitespace,
   * newline boundaries, and markdown headers.
   * Keeps abbreviations (e.g., "U.S.A.") together by requiring
   * the character after the period to be uppercase or a newline.
   */
  private splitSentences(text: string): string[] {
    // Split on sentence-ending punctuation followed by space + uppercase,
    // or on single newlines.
    const parts = text.split(/(?<=[.!?])\s+(?=[A-Z])|\n/);
    const sentences: string[] = [];

    for (const part of parts) {
      const s = part.trim();
      if (s.length > 0) sentences.push(s);
    }

    return sentences;
  }

  /**
   * Given a forward cursor `end` (exclusive), walk backward through
   * segments to find the start position that creates an overlap of
   * approximately `overlapTokens`.
   *
   * Stops rewinding if it hits a section header — overlap should not
   * carry context across topic boundaries.
   */
  private rewindForOverlap(
    segments: string[],
    end: number,
    overlapTokens: number,
  ): number {
    if (overlapTokens <= 0 || end <= 0) return end;

    let tokens = 0;
    let pos = end;

    while (pos > 0) {
      pos--;

      // Don't pull overlap across section boundaries
      if (this.isSectionHeader(segments[pos])) {
        pos++; // don't include the header in overlap
        break;
      }

      tokens += this.estimateTokens(segments[pos]);
      if (tokens >= overlapTokens) break;
    }

    return pos;
  }

  /**
   * Last-resort: splits a single enormous segment into slices of at most
   * `maxTokens` estimated tokens each, breaking at word boundaries to
   * preserve readability.
   */
  private hardSplit(text: string, maxTokens: number): string[] {
    const maxChars = maxTokens * CHARS_PER_TOKEN;
    const parts: string[] = [];

    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= maxChars) {
        const trimmed = remaining.trim();
        if (trimmed.length > 0) parts.push(trimmed);
        break;
      }

      // Take maxChars, then back up to the last space to avoid mid-word cuts
      let sliceEnd = maxChars;
      const lastSpace = remaining.lastIndexOf(' ', sliceEnd);
      if (lastSpace > maxChars * 0.5) {
        // Only use the word boundary if it's reasonably close (>50% of max)
        sliceEnd = lastSpace;
      }

      const slice = remaining.slice(0, sliceEnd).trim();
      if (slice.length > 0) parts.push(slice);

      remaining = remaining.slice(sliceEnd).trim();
    }

    return parts;
  }
}
