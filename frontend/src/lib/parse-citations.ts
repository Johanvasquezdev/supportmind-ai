export interface ContextItem {
  vectorId: string;
  score: number;
  text: string;
  metadata: {
    documentId: string;
    chunkIndex: number;
    tenantId: string;
  };
}

export type MessageSegment = 
  | { type: 'text'; content: string }
  | { type: 'citation'; index: number; item: ContextItem };

/**
 * Parses message text and extracts [Context N] citation tags into segments.
 * Maps [Context N] (1-based index) to the context array (0-based index).
 */
export function parseMessageWithCitations(
  message: string,
  context: ContextItem[] = []
): MessageSegment[] {
  if (!message) return [];
  if (!context || context.length === 0) {
    return [{ type: 'text', content: message }];
  }

  const segments: MessageSegment[] = [];
  const regex = /\[Context (\d+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(message)) !== null) {
    // Add text segment before the match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: message.substring(lastIndex, match.index),
      });
    }

    const citationIndex = parseInt(match[1], 10);
    const contextItem = context[citationIndex - 1];

    if (contextItem) {
      segments.push({
        type: 'citation',
        index: citationIndex,
        item: contextItem,
      });
    } else {
      // If citation points to missing context, treat as plain text
      segments.push({
        type: 'text',
        content: match[0],
      });
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < message.length) {
    segments.push({
      type: 'text',
      content: message.substring(lastIndex),
    });
  }

  return segments;
}
