import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ─── Defaults ────────────────────────────────────────────────────────────────
// 20 requests per 60 seconds is a sensible MVP default for an AI chat
// endpoint. Each request costs real money (OpenAI tokens), so we want
// to prevent accidental loops and abuse without blocking normal usage.
const DEFAULT_WINDOW_MS = 60_000;   // 1 minute
const DEFAULT_MAX_REQUESTS = 20;    // per tenant per window

// Stale buckets are cleaned up every 5 minutes to prevent memory leaks
// from tenants that made a few requests and never came back.
const CLEANUP_INTERVAL_MS = 5 * 60_000;

/**
 * In-memory, per-tenant sliding-window rate limiter.
 *
 * How it works:
 *   1. For each request, look up the tenant's timestamp array.
 *   2. Drop all timestamps older than the window.
 *   3. If the remaining count >= limit → reject with 429.
 *   4. Otherwise, record the current timestamp and allow.
 *
 * Trade-offs:
 *   - No Redis dependency — just a Map in memory.
 *   - Resets on server restart (acceptable for MVP).
 *   - Not shared across multiple server instances (use Redis when you scale).
 *   - O(n) per request where n = requests in window (capped at limit, so tiny).
 */
@Injectable()
export class TenantRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(TenantRateLimitGuard.name);
  private readonly buckets = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly config: ConfigService) {
    this.windowMs = this.config.get<number>('RATE_LIMIT_WINDOW_MS') ?? DEFAULT_WINDOW_MS;
    this.maxRequests = this.config.get<number>('RATE_LIMIT_MAX_REQUESTS') ?? DEFAULT_MAX_REQUESTS;

    // Periodic cleanup of stale tenant buckets
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);

    // Allow Node to exit even if the timer is still running
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }

    this.logger.log(
      `Rate limiting: ${this.maxRequests} requests per ${this.windowMs / 1000}s per tenant`,
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId: string | undefined = request.user?.tenantId;

    // If there's no tenant (e.g. guard ordering issue), allow the request
    // and let the auth guard handle rejection.
    if (!tenantId) {
      return true;
    }

    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create the tenant's timestamp bucket
    let timestamps = this.buckets.get(tenantId);
    if (!timestamps) {
      timestamps = [];
      this.buckets.set(tenantId, timestamps);
    }

    // Drop timestamps outside the current window
    const recent = timestamps.filter((t) => t > windowStart);

    if (recent.length >= this.maxRequests) {
      // Calculate when the oldest request in the window expires
      const oldestInWindow = recent[0];
      const retryAfterMs = oldestInWindow + this.windowMs - now;
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      this.logger.warn(
        `Tenant ${tenantId} rate limited: ${recent.length}/${this.maxRequests} in ${this.windowMs / 1000}s`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Try again in ${retryAfterSec} seconds.`,
          retryAfter: retryAfterSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Record this request
    recent.push(now);
    this.buckets.set(tenantId, recent);

    return true;
  }

  /**
   * Removes empty or fully-expired buckets to prevent unbounded memory growth.
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    let removed = 0;

    for (const [tenantId, timestamps] of this.buckets.entries()) {
      const recent = timestamps.filter((t) => t > windowStart);
      if (recent.length === 0) {
        this.buckets.delete(tenantId);
        removed++;
      } else {
        this.buckets.set(tenantId, recent);
      }
    }

    if (removed > 0) {
      this.logger.debug(`Cleaned up ${removed} stale rate-limit buckets`);
    }
  }

  // ─── Test helpers ──────────────────────────────────────────────────────────

  /** Clears all buckets (for testing). */
  reset(): void {
    this.buckets.clear();
  }

  /** Returns the current request count for a tenant (for testing). */
  getCount(tenantId: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = this.buckets.get(tenantId) ?? [];
    return timestamps.filter((t) => t > windowStart).length;
  }

  /** Stops the cleanup timer (for testing). */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}
