import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { RagChunk } from '../rag/rag.service';

const FALLBACK_ANSWER =
  "I don't have enough information in the provided company knowledge base to answer that.";
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_MESSAGE_LENGTH = 4000;
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 2000;
const GEMINI_OPENAI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';

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
  systemPromptOverride?: string;
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

export interface AiStreamParams {
  message: string;
  context: RagChunk[];
  history?: ConversationMessage[];
  mode?: AnswerMode;
}

interface ApiErrorShape {
  status?: number;
  response?: {
    status?: number;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const groqApiKey = this.config.get<string>('GROQ_API_KEY');
    const geminiApiKey =
      this.config.get<string>('GEMINI_API_KEY') ??
      this.config.get<string>('GOOGLE_AI_API_KEY');
    const openAiApiKey = this.config.get<string>('OPENAI_API_KEY');
    
    // Priority: Groq > Gemini > OpenAI
    const apiKey = groqApiKey ?? geminiApiKey ?? openAiApiKey;

    if (!apiKey) {
      throw new InternalServerErrorException(
        'AI provider API key is required (GROQ_API_KEY or GEMINI_API_KEY)',
      );
    }

    this.openai = new OpenAI({
      apiKey,
      baseURL: groqApiKey 
        ? this.config.get<string>('GROQ_OPENAI_BASE_URL') ?? 'https://api.groq.com/openai/v1'
        : geminiApiKey
        ? this.config.get<string>('GEMINI_OPENAI_BASE_URL') ?? GEMINI_OPENAI_BASE_URL
        : undefined,
    });

    this.model = groqApiKey
      ? this.config.get<string>('GROQ_CHAT_MODEL') ?? 'llama-3.3-70b-versatile'
      : geminiApiKey
      ? this.config.get<string>('GEMINI_CHAT_MODEL') ?? 'gemini-2.0-flash'
      : this.config.get<string>('OPENAI_CHAT_MODEL') ?? 'gpt-4o-mini';
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
      systemPromptOverride: input.systemPromptOverride,
    });

    const completion = await this.callWithRetry(messages, 0.2);

    const answer = completion.choices[0]?.message?.content?.trim();

    if (!answer) {
      this.logger.warn('AI provider returned an empty response');
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

  async *streamResponse(input: AiStreamParams): AsyncGenerator<string, void, unknown> {
    const message = input.message.trim();

    if (!message) {
      throw new BadRequestException('message is required');
    }

    if (input.context.length === 0) {
      yield FALLBACK_ANSWER;
      return;
    }

    const messages = this.buildMessages({
      message,
      context: input.context,
      history: input.history ?? [],
      mode: input.mode ?? 'answer',
    });

    let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk> | undefined;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        stream = await this.openai.chat.completions.create({
          model: this.model,
          messages,
          temperature: 0.2,
          stream: true,
        });
        break;
      } catch (error) {
        const err = this.toError(error);
        lastError = err;
        const status = this.getStatus(error);
        const isRetryable = [429, 500, 502, 503].includes(status);

        if (!isRetryable || attempt === MAX_RETRIES) {
          const friendlyMessage = status === 429 
            ? "The AI system is currently busy (Rate Limit). Please wait a few seconds and try again."
            : `AI stream failed: ${err.message}`;
          this.logger.error(`AI stream failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);
          throw new InternalServerErrorException(friendlyMessage);
        }

        const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    if (!stream) throw lastError ?? new InternalServerErrorException('Stream initiation failed');

    let totalOutputTokens = 0;

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content ?? '';
      if (token) {
        totalOutputTokens++;
        yield token;
      }

      if (chunk.usage) {
        totalOutputTokens = chunk.usage.completion_tokens ?? totalOutputTokens;
      }
    }

    this.logger.debug(`Stream completed with ${totalOutputTokens} output tokens`);
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async generateSummary(prompt: string): Promise<string> {
    const completion = await this.callWithRetry([
      {
        role: 'system',
        content: 'You are a helpful assistant that summarizes documents clearly and concisely for text-to-speech conversion.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], 0.3);

    const summary = completion.choices[0]?.message?.content?.trim();
    if (!summary) {
      throw new InternalServerErrorException('Failed to generate summary');
    }
    return summary;
  }

  private async callWithRetry(
    messages: ChatCompletionMessageParam[],
    temperature: number,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.openai.chat.completions.create({
          model: this.model,
          messages,
          temperature,
        });
      } catch (error) {
        const err = this.toError(error);
        lastError = err;
        const status = this.getStatus(error);
        const isRetryable = [429, 500, 502, 503].includes(status);

        if (!isRetryable || attempt === MAX_RETRIES) {
          const friendlyMessage = status === 429 
            ? "The AI system is currently busy (Rate Limit). Please wait a few seconds and try again."
            : `AI call failed: ${err.message}`;
          this.logger.error(
            `AI chat completion failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`,
          );
          throw new InternalServerErrorException(friendlyMessage);
        }

        const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
        this.logger.warn(
          `AI chat attempt ${attempt} failed (${status}), retrying in ${delayMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw lastError ?? new InternalServerErrorException('Chat completion failed');
  }

  private getStatus(error: unknown): number {
    const shaped = error as ApiErrorShape;
    return shaped.status ?? shaped.response?.status ?? 0;
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  buildMessages({
    message,
    context,
    history,
    mode,
    systemPromptOverride,
  }: {
    message: string;
    context: RagChunk[];
    history: ConversationMessage[];
    mode?: AnswerMode;
    systemPromptOverride?: string;
  }): ChatCompletionMessageParam[] {
    const systemContent = systemPromptOverride ?? [
      'You are SupportMind AI, a customer support assistant.',
      'Answer only using the provided company context.',
      'If the context does not contain the answer, say you do not have enough information.',
      'Do not guess, invent policies, or use outside knowledge.',
      'When possible, cite the context number like [Context 1].',
      'Keep answers concise, helpful, and professional.',
      this.getModeInstruction(mode ?? 'answer'),
    ].join('\n');
    return [
      {
        role: 'system',
        content: systemContent,
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
