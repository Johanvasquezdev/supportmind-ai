import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { hashApiKey } from '../api-key.util';

type ClerkRequest = Request & {
  user?: {
    authType: 'clerk';
    userId: string;
    email?: string;
    tenantId: string;
  };
};

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ClerkRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');

    if (!secretKey) {
      throw new UnauthorizedException('Clerk is not configured');
    }

    try {
      const verified = await verifyToken(token, { secretKey, clockSkewInMs: 1000 * 60 * 60 * 24 * 365 * 5 });
      const userId = String(verified.sub ?? '');

      if (!userId) {
        throw new UnauthorizedException('Invalid Clerk token');
      }

      const tenantId = await this.resolveTenantId(userId);

      request.user = {
        authType: 'clerk',
        userId,
        email:
          typeof verified.email === 'string' ? verified.email : undefined,
        tenantId,
      };

      return true;
    } catch (e) {
      console.error('Token verification error:', e);
      throw new UnauthorizedException('Invalid Clerk token');
    }
  }

  private extractBearerToken(request: Request): string | undefined {
    const header = request.header('authorization');
    const [type, token] = header?.split(' ') ?? [];

    if (type?.toLowerCase() !== 'bearer') {
      return undefined;
    }

    return token;
  }

  private async resolveTenantId(userId: string): Promise<string> {
    const configuredTenantId = this.config.get<string>('DEFAULT_TENANT_ID');

    if (configuredTenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: configuredTenantId },
        select: { id: true },
      });

      if (tenant) {
        return tenant.id;
      }
    }

    const existingTenant = await this.prisma.tenant.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (existingTenant) {
      return existingTenant.id;
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: 'Default Tenant',
        apiKeyHash: hashApiKey(`dev-${userId}-${Date.now()}`),
      },
      select: { id: true },
    });

    return tenant.id;
  }
}
