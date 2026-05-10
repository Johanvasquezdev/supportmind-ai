import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let aiService: jest.Mocked<Pick<AiService, 'generateResponse'>>;
  let ragService: jest.Mocked<Pick<RagService, 'retrieve'>>;
  let prisma: {
    conversation: {
      create: jest.Mock;
      findFirst: jest.Mock;
    };
    message: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
    usage: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    ragService = {
      retrieve: jest.fn().mockResolvedValue([
        {
          vectorId: 'tenant-a-doc-1-0',
          score: 0.9,
          text: 'Refunds are available within 30 days.',
          metadata: {
            tenantId: 'tenant-a',
            text: 'Refunds are available within 30 days.',
            documentId: 'doc-1',
            chunkIndex: 0,
          },
        },
      ]),
    };
    aiService = {
      generateResponse: jest.fn().mockResolvedValue({
        answer: 'Refunds are available within 30 days.',
        context: [],
        usage: {
          inputTokens: 10,
          outputTokens: 8,
          totalTokens: 18,
        },
      }),
    };
    prisma = {
      conversation: {
        create: jest.fn().mockResolvedValue({ id: 'conversation-1' }),
        findFirst: jest.fn(),
      },
      message: {
        create: jest.fn((args) => args),
        findMany: jest.fn().mockResolvedValue([
          { role: 'assistant', content: 'Previous answer' },
          { role: 'user', content: 'Previous question' },
        ]),
      },
      usage: {
        create: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };

    service = new ChatService(
      prisma as unknown as PrismaService,
      ragService as unknown as RagService,
      aiService as unknown as AiService,
    );
  });

  it('creates a conversation, calls AI, saves both messages, tracks usage, and returns the response', async () => {
    const result = await service.sendMessage({
      tenantId: 'tenant-a',
      userId: 'user-1',
      message: 'What is the refund policy?',
    });

    expect(prisma.conversation.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-a',
        userId: 'user-1',
      },
    });
    expect(ragService.retrieve).toHaveBeenCalledWith(
      'What is the refund policy?',
      'tenant-a',
      5,
    );
    expect(aiService.generateResponse).toHaveBeenCalledWith({
      message: 'What is the refund policy?',
      context: [
        {
          vectorId: 'tenant-a-doc-1-0',
          score: 0.9,
          text: 'Refunds are available within 30 days.',
          metadata: {
            tenantId: 'tenant-a',
            text: 'Refunds are available within 30 days.',
            documentId: 'doc-1',
            chunkIndex: 0,
          },
        },
      ],
      history: [
        { role: 'user', content: 'Previous question' },
        { role: 'assistant', content: 'Previous answer' },
      ],
      mode: 'answer',
    });
    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-a',
          conversationId: 'conversation-1',
          role: 'user',
        }),
      }),
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-a',
          conversationId: 'conversation-1',
          role: 'assistant',
        }),
      }),
    ]);
    expect(prisma.usage.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-a',
        inputTokens: 10,
        outputTokens: 8,
        responseTimeMs: expect.any(Number),
      },
    });
    expect(result).toEqual({
      conversationId: 'conversation-1',
      message: 'Refunds are available within 30 days.',
      context: [],
      usage: {
        inputTokens: 10,
        outputTokens: 8,
        totalTokens: 18,
      },
    });
  });

  it('skips usage tracking when tokens are zero', async () => {
    aiService.generateResponse.mockResolvedValueOnce({
      answer: "I don't have enough information.",
      context: [],
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    });

    await service.sendMessage({
      tenantId: 'tenant-a',
      userId: 'user-1',
      message: 'Something',
    });

    expect(prisma.usage.create).not.toHaveBeenCalled();
  });

  it('trims the user message before retrieval and persistence', async () => {
    await service.sendMessage({
      tenantId: 'tenant-a',
      userId: 'user-1',
      message: '  Hello  ',
    });

    expect(ragService.retrieve).toHaveBeenCalledWith('Hello', 'tenant-a', 5);
    expect(aiService.generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Hello',
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({
        data: expect.objectContaining({
          content: 'Hello',
        }),
      }),
      expect.anything(),
    ]);
  });

  it('rejects blank messages before doing work', async () => {
    await expect(
      service.sendMessage({
        tenantId: 'tenant-a',
        userId: 'user-1',
        message: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.conversation.create).not.toHaveBeenCalled();
    expect(ragService.retrieve).not.toHaveBeenCalled();
  });

  it('uses an existing tenant-owned conversation', async () => {
    prisma.conversation.findFirst.mockResolvedValueOnce({ id: 'conversation-2' });
    prisma.message.findMany.mockResolvedValueOnce([]);

    await service.sendMessage({
      tenantId: 'tenant-a',
      userId: 'user-1',
      conversationId: 'conversation-2',
      message: 'Hello',
    });

    expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'conversation-2',
        tenantId: 'tenant-a',
      },
      select: {
        id: true,
      },
    });
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('rejects conversations outside the current tenant', async () => {
    prisma.conversation.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.sendMessage({
        tenantId: 'tenant-a',
        userId: 'user-1',
        conversationId: 'other-tenant-conversation',
        message: 'Hello',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(aiService.generateResponse).not.toHaveBeenCalled();
    expect(ragService.retrieve).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
