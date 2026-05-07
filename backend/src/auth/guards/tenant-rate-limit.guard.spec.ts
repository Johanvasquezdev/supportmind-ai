import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantRateLimitGuard } from './tenant-rate-limit.guard';

describe('TenantRateLimitGuard', () => {
  let guard: TenantRateLimitGuard;

  const makeContext = (tenantId?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: tenantId ? { tenantId } : undefined,
        }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'RATE_LIMIT_WINDOW_MS') return 60_000;
        if (key === 'RATE_LIMIT_MAX_REQUESTS') return 5; // low limit for testing
        return undefined;
      }),
    } as unknown as ConfigService;

    guard = new TenantRateLimitGuard(config);
  });

  afterEach(() => {
    guard.destroy(); // stop cleanup timer
  });

  // ─── Basic functionality ─────────────────────────────────────────────────

  it('should allow requests under the limit', () => {
    const ctx = makeContext('tenant-a');

    for (let i = 0; i < 5; i++) {
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });

  it('should reject the request that exceeds the limit', () => {
    const ctx = makeContext('tenant-a');

    // Use all 5 allowed requests
    for (let i = 0; i < 5; i++) {
      guard.canActivate(ctx);
    }

    // 6th should fail
    try {
      guard.canActivate(ctx);
      fail('Expected HttpException');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      const response = (err as HttpException).getResponse() as Record<string, unknown>;
      expect(response.retryAfter).toBeDefined();
      expect(typeof response.retryAfter).toBe('number');
    }
  });

  it('should include a retryAfter value in seconds', () => {
    const ctx = makeContext('tenant-a');

    for (let i = 0; i < 5; i++) {
      guard.canActivate(ctx);
    }

    try {
      guard.canActivate(ctx);
      fail('Expected HttpException');
    } catch (err) {
      const response = (err as HttpException).getResponse() as Record<string, unknown>;
      expect(response.retryAfter).toBeGreaterThan(0);
      expect(response.retryAfter).toBeLessThanOrEqual(60);
    }
  });

  // ─── Tenant isolation ────────────────────────────────────────────────────

  it('should track tenants independently', () => {
    const ctxA = makeContext('tenant-a');
    const ctxB = makeContext('tenant-b');

    // Max out tenant-a
    for (let i = 0; i < 5; i++) {
      guard.canActivate(ctxA);
    }

    // tenant-b should still be allowed
    expect(guard.canActivate(ctxB)).toBe(true);
    expect(guard.getCount('tenant-a')).toBe(5);
    expect(guard.getCount('tenant-b')).toBe(1);
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('should allow requests when no tenant is attached (let auth guard handle)', () => {
    const ctx = makeContext(undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should reset counts after the window expires', () => {
    const ctx = makeContext('tenant-a');

    // Max out the limit
    for (let i = 0; i < 5; i++) {
      guard.canActivate(ctx);
    }

    expect(guard.getCount('tenant-a')).toBe(5);

    // Simulate time passing by clearing the bucket
    guard.reset();
    expect(guard.getCount('tenant-a')).toBe(0);

    // Should work again
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('getCount should return 0 for unknown tenants', () => {
    expect(guard.getCount('unknown-tenant')).toBe(0);
  });
});
