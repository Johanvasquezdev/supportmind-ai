import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AiService', () => {
  const context = [
    {
      vectorId: 'doc-1-0',
      score: 0.92,
      text: 'Refunds are available within 30 days.',
      metadata: {
        tenantId: 'tenant-a',
        text: 'Refunds are available within 30 days.',
        documentId: 'doc-1',
        chunkIndex: 0,
      },
    },
  ];

  let service: AiService;
  let prisma: jest.Mocked<Pick<PrismaService, 'usage'>>;
  let createCompletion: jest.Mock;

  beforeEach(() => {
    prisma = {
      usage: {
        create: jest.fn().mockResolvedValue({}),
      },
    } as unknown as jest.Mocked<Pick<PrismaService, 'usage'>>;
    createCompletion = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'You can request a refund within 30 days.' } }],
      usage: {
        prompt_tokens: 101,
        completion_tokens: 12,
        total_tokens: 113,
      },
    });

    service = new AiService(
      {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'OPENAI_CHAT_MODEL') return 'gpt-4o-mini';
          return undefined;
        }),
        getOrThrow: jest.fn().mockReturnValue('test-openai-key'),
      } as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );

    (service as any).openai = {
      chat: {
        completions: {
          create: createCompletion,
        },
      },
    };
  });

  it('builds a grounded prompt, calls OpenAI, and tracks token usage', async () => {
    const result = await service.generateResponse({
      tenantId: 'tenant-a',
      message: 'Can I get a refund?',
      context,
      history: [{ role: 'user', content: 'Hi' }],
    });

    expect(createCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('Answer only using the provided company context.'),
          }),
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('Refunds are available within 30 days.'),
          }),
        ]),
      }),
    );
    expect(prisma.usage.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-a',
        inputTokens: 101,
        outputTokens: 12,
      },
    });
    expect(result.answer).toBe('You can request a refund within 30 days.');
    expect(result.usage.totalTokens).toBe(113);
  });

  it('refuses when no retrieved context is provided', async () => {
    const result = await service.generateResponse({
      tenantId: 'tenant-a',
      message: 'What is your refund policy?',
      context: [],
    });

    expect(createCompletion).not.toHaveBeenCalled();
    expect(prisma.usage.create).not.toHaveBeenCalled();
    expect(result.answer).toContain("don't have enough information");
  });

  it('keeps only recent conversation history in the prompt', () => {
    const history = Array.from({ length: 12 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
      content: `message-${index}`,
    }));

    const messages = service.buildMessages({
      message: 'Current question',
      context,
      history,
    });

    const contents = messages.map((message) => message.content);
    expect(contents).not.toContain('message-0');
    expect(contents).not.toContain('message-1');
    expect(contents).toContain('message-2');
    expect(contents).toContain('Current question');
  });
});
