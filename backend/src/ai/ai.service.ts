import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { PrismaService } from '../prisma/prisma.service';
import { RagChunk } from '../rag/rag.service';

const FALLBACK_ANSWER =
  "I don't have enough information in the provided company knowledge base to answer that.";
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_MESSAGE_LENGTH = 4000;

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateResponseInput {
  tenantId: string;
  message: string;
  context: RagChunk[];
  history?: ConversationMessage[];
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

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
    this.model = this.config.get<string>('OPENAI_CHAT_MODEL') ?? 'gpt-4o-mini';
  }

  async generateResponse(
    input: GenerateResponseInput,
  ): Promise<GenerateResponseResult> {
    const tenantId = input.tenantId.trim();
    const message = input.message.trim();

    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

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

    await this.trackUsage(tenantId, usage.inputTokens, usage.outputTokens);

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
  }: {
    message: string;
    context: RagChunk[];
    history: ConversationMessage[];
  }): ChatCompletionMessageParam[] {
    return [
      {
        role: 'system',
        content: [
          'You are SupportMind AI, a customer support assistant.',
          'Answer only using the provided company context.',
          'If the context does not contain the answer, say you do not have enough information.',
          'Do not guess, invent policies, or use outside knowledge.',
          'Keep answers concise, helpful, and professional.',
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

  private sanitizeHistory(
    history: ConversationMessage[],
  ): ChatCompletionMessageParam[] {
    return history.slice(-MAX_HISTORY_MESSAGES).map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_HISTORY_MESSAGE_LENGTH),
    }));
  }

  private async trackUsage(
    tenantId: string,
    inputTokens: number,
    outputTokens: number,
  ): Promise<void> {
    if (inputTokens === 0 && outputTokens === 0) {
      return;
    }

    await this.prisma.usage.create({
      data: {
        tenantId,
        inputTokens,
        outputTokens,
      },
    });
  }
}
