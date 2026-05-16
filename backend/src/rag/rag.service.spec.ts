import { BadRequestException } from '@nestjs/common';
import { SearchService } from '../search/search.service';
import { RagService } from './rag.service';

describe('RagService', () => {
  let service: RagService;
  let searchService: jest.Mocked<Pick<SearchService, 'hybridSearch'>>;

  beforeEach(() => {
    searchService = {
      hybridSearch: jest.fn().mockResolvedValue([
        {
          chunkId: 'chunk-1',
          documentId: 'doc-1',
          documentTitle: 'Refund Policy',
          text: 'Relevant tenant text',
          vectorScore: 0.91,
          keywordScore: 0.5,
          hybridScore: 0.78,
          chunkIndex: 0,
        },
      ]),
    };

    service = new RagService(searchService as unknown as SearchService);
  });

  it('retrieves hybrid search results and preserves the RagChunk interface', async () => {
    const results = await service.retrieve('How do refunds work?', 'tenant-a', 5);

    expect(searchService.hybridSearch).toHaveBeenCalledWith(
      'How do refunds work?',
      'tenant-a',
      {
        limit: 5,
        minScore: 0.55,
      },
    );

    expect(results).toEqual([
      {
        vectorId: 'chunk-1',
        score: 0.78,
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

  it('clamps final topK to the 3 to 5 range', async () => {
    await service.retrieve('Question', 'tenant-a', 99);
    expect(searchService.hybridSearch).toHaveBeenLastCalledWith(
      'Question',
      'tenant-a',
      expect.objectContaining({ limit: 5 }),
    );

    await service.retrieve('Question', 'tenant-a', 1);
    expect(searchService.hybridSearch).toHaveBeenLastCalledWith(
      'Question',
      'tenant-a',
      expect.objectContaining({ limit: 3 }),
    );
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
