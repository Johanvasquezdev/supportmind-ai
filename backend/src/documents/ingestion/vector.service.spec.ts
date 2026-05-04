import { ConfigService } from '@nestjs/config';
import { VectorRecord, VectorService } from './vector.service';

describe('VectorService', () => {
  let service: VectorService;

  const makeRecord = (
    id: string,
    tenantId: string,
    documentId: string,
    values: number[],
    text = 'stored text',
  ): VectorRecord => ({
    id,
    values,
    metadata: {
      tenantId,
      documentId,
      chunkIndex: 0,
      text,
    },
  });

  beforeEach(() => {
    service = new VectorService({
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService);
  });

  it('stores embeddings with tenant metadata', async () => {
    await service.upsert([
      makeRecord('doc-1-0', 'tenant-a', 'doc-1', [1, 0], 'hello'),
    ]);

    expect(service.size).toBe(1);
    expect(service.getByTenant('tenant-a')[0].metadata).toMatchObject({
      tenantId: 'tenant-a',
      text: 'hello',
    });
  });

  it('returns similar vectors only for the requested tenant', async () => {
    await service.upsert([
      makeRecord('tenant-a-doc-1', 'tenant-a', 'doc-1', [1, 0], 'tenant a'),
      makeRecord('tenant-b-doc-1', 'tenant-b', 'doc-1', [1, 0], 'tenant b'),
      makeRecord('tenant-a-doc-2', 'tenant-a', 'doc-2', [0, 1], 'other'),
    ]);

    const results = await service.query([1, 0], 'tenant-a', 5);

    expect(results.map((result) => result.vectorId)).toEqual([
      'tenant-a-doc-1',
      'tenant-a-doc-2',
    ]);
    expect(results.every((result) => result.metadata.tenantId === 'tenant-a')).toBe(
      true,
    );
  });

  it('deletes vectors by tenant and document', async () => {
    await service.upsert([
      makeRecord('a-1', 'tenant-a', 'doc-1', [1, 0]),
      makeRecord('b-1', 'tenant-b', 'doc-1', [1, 0]),
    ]);

    await service.deleteByDocument('tenant-a', 'doc-1');

    expect(service.size).toBe(1);
    expect(service.getByTenant('tenant-b')).toHaveLength(1);
  });
});
