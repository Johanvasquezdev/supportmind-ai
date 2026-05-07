import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { RagChunk } from '../rag/rag.service';

const FALLBACK_ANSWER =
  "I don't have enough information in the provided company knowledge base to answer that.";
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_MESSAGE_LENGTH = 4000;

export type AnswerMode = 'answer' | 'summary' | 'exact';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateResponseInput {
  message: string;
  context: RagChunk[];
  history?: ConversationMessage[];
  mode?: AnswerMode;
}

export interface GenerateResponseResult {
  answer: string;
  context: RagChunk[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
    this.model = this.config.get<string>('OPENAI_CHAT_MODEL') ?? 'gpt-4o-mini';
  }

  async generateResponse(
    input: GenerateResponseInput,
  ): Promise<GenerateResponseResult> {
    const message = input.message.trim();

    if (!message) {
      throw new BadRequestException('message is required');
    }

    if (input.context.length === 0) {
      return {
        answer: FALLBACK_ANSWER,
        context: input.context,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        },
      };
    }

    const messages = this.buildMessages({
      message,
      context: input.context,
      history: input.history ?? [],
      mode: input.mode ?? 'answer',
    });

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.2,
    });

    const answer = completion.choices[0]?.message?.content?.trim();

    if (!answer) {
      this.logger.warn('OpenAI returned an empty response');
    }

    const usage = {
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
    };

    return {
      answer: answer ?? FALLBACK_ANSWER,
      context: input.context,
      usage,
    };
  }

  buildMessages({
    message,
    context,
    history,
    mode,
  }: {
    message: string;
    context: RagChunk[];
    history: ConversationMessage[];
    mode?: AnswerMode;
  }): ChatCompletionMessageParam[] {
    return [
      {
        role: 'system',
        content: [
          'You are SupportMind AI, a customer support assistant.',
          'Answer only using the provided company context.',
          'If the context does not contain the answer, say you do not have enough information.',
          'Do not guess, invent policies, or use outside knowledge.',
          'When possible, cite the context number like [Context 1].',
          'Keep answers concise, helpful, and professional.',
          this.getModeInstruction(mode ?? 'answer'),
        ].join('\n'),
      },
      {
        role: 'system',
        content: this.formatContext(context),
      },
      ...this.sanitizeHistory(history),
      {
        role: 'user',
        content: message,
      },
    ];
  }

  private formatContext(context: RagChunk[]): string {
    const chunks = context
      .map((chunk, index) => {
        return [
          `[Context ${index + 1}]`,
          `score: ${chunk.score.toFixed(4)}`,
          `documentId: ${chunk.metadata.documentId ?? 'unknown'}`,
          `chunkIndex: ${chunk.metadata.chunkIndex ?? 'unknown'}`,
          chunk.text,
        ].join('\n');
      })
      .join('\n\n');

    return `Company context:\n${chunks}`;
  }

  private getModeInstruction(mode: AnswerMode): string {
    if (mode === 'summary') {
      return 'Mode: summary. Summarize the relevant context into clear bullets, then mention the main source context numbers.';
    }

    if (mode === 'exact') {
      return 'Mode: exact answer. Give the shortest direct answer supported by the context. If useful, quote only a short phrase from the context.';
    }

    return 'Mode: answer. Answer the user question directly using the context.';
  }

  private sanitizeHistory(
    history: ConversationMessage[],
  ): ChatCompletionMessageParam[] {
    return history.slice(-MAX_HISTORY_MESSAGES).map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_HISTORY_MESSAGE_LENGTH),
    }));
  }
}
