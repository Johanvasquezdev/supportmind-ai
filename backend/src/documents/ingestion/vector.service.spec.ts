import { BadRequestException } from '@nestjs/common';
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

  // ─── Upsert ─────────────────────────────────────────────────────────────

  describe('upsert', () => {
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

    it('rejects records with missing tenantId', async () => {
      const record = makeRecord('id-1', '', 'doc-1', [1, 0]);

      await expect(service.upsert([record])).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(service.size).toBe(0);
    });

    it('rejects records with whitespace-only tenantId', async () => {
      const record = makeRecord('id-1', '   ', 'doc-1', [1, 0]);

      await expect(service.upsert([record])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects records with missing text', async () => {
      const record = makeRecord('id-1', 'tenant-a', 'doc-1', [1, 0], '');

      await expect(service.upsert([record])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects batches with mixed tenantIds', async () => {
      await expect(
        service.upsert([
          makeRecord('id-1', 'tenant-a', 'doc-1', [1, 0]),
          makeRecord('id-2', 'tenant-b', 'doc-2', [0, 1]),
        ]),
      ).rejects.toThrow('mixed tenants');

      expect(service.size).toBe(0);
    });

    it('accepts empty upsert without error', async () => {
      await expect(service.upsert([])).resolves.toBeUndefined();
    });
  });

  // ─── Query ──────────────────────────────────────────────────────────────

  describe('query', () => {
    it('returns similar vectors only for the requested tenant', async () => {
      await service.upsert([
        makeRecord('tenant-a-doc-1', 'tenant-a', 'doc-1', [1, 0], 'tenant a'),
      ]);
      await service.upsert([
        makeRecord('tenant-b-doc-1', 'tenant-b', 'doc-1', [1, 0], 'tenant b'),
      ]);
      await service.upsert([
        makeRecord('tenant-a-doc-2', 'tenant-a', 'doc-2', [0, 1], 'other'),
      ]);

      const results = await service.query([1, 0], 'tenant-a', 5);

      expect(results.map((r) => r.vectorId)).toEqual([
        'tenant-a-doc-1',
        'tenant-a-doc-2',
      ]);
      expect(results.every((r) => r.metadata.tenantId === 'tenant-a')).toBe(true);
    });

    it('never returns vectors from other tenants', async () => {
      await service.upsert([
        makeRecord('b-1', 'tenant-b', 'doc-1', [1, 0], 'secret'),
      ]);

      const results = await service.query([1, 0], 'tenant-a', 10);

      expect(results).toHaveLength(0);
    });

    it('rejects empty tenantId', async () => {
      await expect(service.query([1, 0], '', 5)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects whitespace-only tenantId', async () => {
      await expect(service.query([1, 0], '   ', 5)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('returns empty array when no vectors exist for tenant', async () => {
      const results = await service.query([1, 0], 'nonexistent', 5);
      expect(results).toEqual([]);
    });
  });

  // ─── Delete ─────────────────────────────────────────────────────────────

  describe('deleteByDocument', () => {
    it('deletes vectors scoped to tenant + document', async () => {
      await service.upsert([
        makeRecord('a-1', 'tenant-a', 'doc-1', [1, 0]),
      ]);
      await service.upsert([
        makeRecord('b-1', 'tenant-b', 'doc-1', [1, 0]),
      ]);

      await service.deleteByDocument('tenant-a', 'doc-1');

      expect(service.size).toBe(1);
      expect(service.getByTenant('tenant-b')).toHaveLength(1);
    });

    it('does not delete vectors from other tenants with the same documentId', async () => {
      await service.upsert([
        makeRecord('a-1', 'tenant-a', 'shared-doc', [1, 0]),
      ]);
      await service.upsert([
        makeRecord('b-1', 'tenant-b', 'shared-doc', [1, 0]),
      ]);

      await service.deleteByDocument('tenant-a', 'shared-doc');

      expect(service.size).toBe(1);
      expect(service.getByTenant('tenant-b')).toHaveLength(1);
    });

    it('rejects empty tenantId', async () => {
      await expect(
        service.deleteByDocument('', 'doc-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects empty documentId', async () => {
      await expect(
        service.deleteByDocument('tenant-a', ''),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ─── Diagnostic helpers ─────────────────────────────────────────────────

  describe('getByDocument', () => {
    it('scopes results to tenant + document', async () => {
      await service.upsert([
        makeRecord('a-1', 'tenant-a', 'doc-1', [1, 0]),
      ]);
      await service.upsert([
        makeRecord('b-1', 'tenant-b', 'doc-1', [1, 0]),
      ]);

      const results = service.getByDocument('tenant-a', 'doc-1');

      expect(results).toHaveLength(1);
      expect(results[0].metadata.tenantId).toBe('tenant-a');
    });

    it('rejects empty tenantId', () => {
      expect(() => service.getByDocument('', 'doc-1')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('getByTenant', () => {
    it('rejects empty tenantId', () => {
      expect(() => service.getByTenant('')).toThrow(BadRequestException);
    });
  });
});
