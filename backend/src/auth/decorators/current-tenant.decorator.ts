import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Pulls tenantId from the authenticated request context.
 * JwtAuthGuard and ApiKeyAuthGuard both attach req.user.tenantId.
 */
export const CurrentTenant = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().user.tenantId;
  },
);
