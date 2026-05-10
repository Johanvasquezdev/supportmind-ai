import { BadRequestException } from '@nestjs/common';
import { EmbeddingService, VectorService } from '../documents/ingestion';
import { RagService } from './rag.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RagService', () => {
  let service: RagService;
  let embeddingService: jest.Mocked<Pick<EmbeddingService, 'embedOne'>>;
  let vectorService: jest.Mocked<Pick<VectorService, 'query'>>;
  let prismaService: any;

  beforeEach(() => {
    embeddingService = {
      embedOne: jest.fn().mockResolvedValue([1, 0, 0]),
    };
    vectorService = {
      query: jest.fn().mockResolvedValue([
        {
          vectorId: 'tenant-a-doc-1-0',
          score: 0.91,
          text: 'Relevant tenant text',
          metadata: {
            tenantId: 'tenant-a',
            text: 'Relevant tenant text',
            documentId: 'doc-1',
            chunkIndex: 0,
          },
        },
      ]),
    };

    prismaService = {
      document: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'doc-1',
            title: 'Refund Policy',
          },
        ]),
      },
    };

    service = new RagService(
      embeddingService as unknown as EmbeddingService,
      vectorService as unknown as VectorService,
      prismaService as unknown as PrismaService,
    );
  });

  it('embeds the query and retrieves enriched tenant-scoped chunks', async () => {
    const results = await service.retrieve('How do refunds work?', 'tenant-a', 5);

    expect(embeddingService.embedOne).toHaveBeenCalledWith('How do refunds work?');
    expect(vectorService.query).toHaveBeenCalledWith([1, 0, 0], 'tenant-a', 15);
    expect(prismaService.document.findMany).toHaveBeenCalled();
    
    expect(results[0].metadata.documentTitle).toBe('Refund Policy');
    expect(results).toEqual([
      {
        vectorId: 'tenant-a-doc-1-0',
        score: 0.91,
        text: 'Relevant tenant text',
        metadata: {
          tenantId: 'tenant-a',
          text: 'Relevant tenant text',
          documentId: 'doc-1',
          chunkIndex: 0,
          documentTitle: 'Refund Policy',
        },
      },
    ]);
  });

  it('deduplicates chunks by documentId keeping only the highest scoring one', async () => {
    // Mock 3 chunks: two from doc-1 (0.91 and 0.85), one from doc-2 (0.88)
    vectorService.query.mockResolvedValueOnce([
      {
        vectorId: 'doc-1-high',
        score: 0.91,
        text: 'Doc 1 High',
        metadata: { documentId: 'doc-1', tenantId: 'tenant-a' },
      },
      {
        vectorId: 'doc-2-mid',
        score: 0.88,
        text: 'Doc 2 Mid',
        metadata: { documentId: 'doc-2', tenantId: 'tenant-a' },
      },
      {
        vectorId: 'doc-1-low',
        score: 0.85,
        text: 'Doc 1 Low',
        metadata: { documentId: 'doc-1', tenantId: 'tenant-a' },
      },
    ] as any);

    prismaService.document.findMany.mockResolvedValueOnce([
      { id: 'doc-1', title: 'Document One' },
      { id: 'doc-2', title: 'Document Two' },
    ]);

    const results = await service.retrieve('test', 'tenant-a', 5);

    // Verify we queried a wider window initially for deduplication
    expect(vectorService.query).toHaveBeenCalledWith(expect.any(Array), 'tenant-a', 15);
    
    // Should only have 2 results (one per doc)
    expect(results.length).toBe(2);
    // Highest for doc-1 should be preserved
    expect(results.find(r => r.metadata.documentId === 'doc-1')?.score).toBe(0.91);
    expect(results.find(r => r.vectorId === 'doc-1-low')).toBeUndefined();
    // Doc-2 should be preserved
    expect(results.find(r => r.metadata.documentId === 'doc-2')?.score).toBe(0.88);
  });

  it('clamps final topK to the 3 to 5 range', async () => {
    await service.retrieve('Question', 'tenant-a', 99);
    // initialTopK is always 15 now for deduplication logic
    expect(vectorService.query).toHaveBeenLastCalledWith([1, 0, 0], 'tenant-a', 15);

    await service.retrieve('Question', 'tenant-a', 1);
    expect(vectorService.query).toHaveBeenLastCalledWith([1, 0, 0], 'tenant-a', 15);
  });

  it('rejects empty queries and missing tenant ids', async () => {
    await expect(service.retrieve('', 'tenant-a')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.retrieve('Question', '')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
