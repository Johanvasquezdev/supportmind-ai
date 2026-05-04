import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiKeyAuthGuard } from './api-key-auth.guard';

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

  beforeEach(() => {
    prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ id: 'tenant-a' }),
      },
    };
    guard = new ApiKeyAuthGuard(prisma as unknown as PrismaService);
  });

  it('resolves tenant from x-api-key header', async () => {
    const request: TestRequest = {
      header: jest.fn().mockReturnValue('  public-key-123456789  '),
      body: {},
    };

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);

    expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
      where: {
        apiKey: 'public-key-123456789',
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

  it('rejects missing or malformed API keys', async () => {
    const request: TestRequest = {
      header: jest.fn().mockReturnValue(undefined),
      body: {
        apiKey: 'short',
      },
    };

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
  });

  it('rejects unknown API keys', async () => {
    prisma.tenant.findUnique.mockResolvedValueOnce(null);
    const request: TestRequest = {
      header: jest.fn().mockReturnValue('unknown-public-key-123'),
      body: {},
    };

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(request.user).toBeUndefined();
  });
});
