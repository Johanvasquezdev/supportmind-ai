import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { hashApiKey } from '../api-key.util';

describe('ApiKeyAuthGuard', () => {
  let guard: ApiKeyAuthGuard;
  let prisma: {
    tenant: {
      findUnique: jest.Mock;
    };
  };

  type TestRequest = {
    header: jest.Mock;
    body: Record<string, unknown>;
    user?: unknown;
  };

  const makeContext = (request: TestRequest): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  const VALID_RAW_KEY = 'smk_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
  const VALID_KEY_HASH = hashApiKey(VALID_RAW_KEY);

  beforeEach(() => {
    prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ id: 'tenant-a' }),
      },
    };
    guard = new ApiKeyAuthGuard(prisma as unknown as PrismaService);
  });

  it('hashes the incoming key and looks up by hash', async () => {
    const request: TestRequest = {
      header: jest.fn().mockReturnValue(`  ${VALID_RAW_KEY}  `),
      body: {},
    };

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);

    // The guard should hash the key before querying — never query with raw key
    expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
      where: {
        apiKeyHash: VALID_KEY_HASH,
      },
      select: {
        id: true,
      },
    });
    expect(request.user).toEqual({
      authType: 'apiKey',
      tenantId: 'tenant-a',
    });
  });

  it('rejects body apiKey when header is missing', async () => {
    const request: TestRequest = {
      header: jest.fn().mockReturnValue(undefined),
      body: {
        apiKey: 'body-public-key-123456',
      },
    };

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
  });

  it('rejects short API keys without hitting the database', async () => {
    const request: TestRequest = {
      header: jest.fn().mockReturnValue('short'),
      body: {},
    };

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
  });

  it('rejects unknown API keys (hash not found)', async () => {
    prisma.tenant.findUnique.mockResolvedValueOnce(null);
    const request: TestRequest = {
      header: jest.fn().mockReturnValue('unknown-public-key-1234567890'),
      body: {},
    };

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(request.user).toBeUndefined();
  });

  it('uses the same hash function as api-key.util', async () => {
    const request: TestRequest = {
      header: jest.fn().mockReturnValue(VALID_RAW_KEY),
      body: {},
    };

    await guard.canActivate(makeContext(request));

    // Verify the hash passed to Prisma matches what hashApiKey produces
    const calledHash = prisma.tenant.findUnique.mock.calls[0][0].where.apiKeyHash;
    expect(calledHash).toBe(hashApiKey(VALID_RAW_KEY));
    expect(calledHash).toHaveLength(64); // SHA-256 hex = 64 chars
  });
});
