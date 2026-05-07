import { BadRequestException } from '@nestjs/common';
import { EmbeddingService, VectorService } from '../documents/ingestion';
import { RagService } from './rag.service';

describe('RagService', () => {
  let service: RagService;
  let embeddingService: jest.Mocked<Pick<EmbeddingService, 'embedOne'>>;
  let vectorService: jest.Mocked<Pick<VectorService, 'query'>>;

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

    service = new RagService(
      embeddingService as unknown as EmbeddingService,
      vectorService as unknown as VectorService,
    );
  });

  it('embeds the query and retrieves tenant-scoped chunks', async () => {
    const results = await service.retrieve('How do refunds work?', 'tenant-a', 5);

    expect(embeddingService.embedOne).toHaveBeenCalledWith('How do refunds work?');
    expect(vectorService.query).toHaveBeenCalledWith([1, 0, 0], 'tenant-a', 5);
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
        },
      },
    ]);
  });

  it('clamps topK to the 3 to 5 range', async () => {
    await service.retrieve('Question', 'tenant-a', 99);
    expect(vectorService.query).toHaveBeenLastCalledWith([1, 0, 0], 'tenant-a', 5);

    await service.retrieve('Question', 'tenant-a', 1);
    expect(vectorService.query).toHaveBeenLastCalledWith([1, 0, 0], 'tenant-a', 3);
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
