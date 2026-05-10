import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
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
  private readonly logger = new Logger(ClerkAuthGuard.name);

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

      const email = typeof verified.email === 'string' ? verified.email : `clerk-${userId}@temp.com`;
      const tenantId = await this.resolveTenantId(userId, email);

      request.user = {
        authType: 'clerk',
        userId,
        email: email !== `clerk-${userId}@temp.com` ? email : undefined,
        tenantId,
      };

      return true;
    } catch (e) {
      this.logger.error('Auth Guard Error:', e);
      if (e instanceof Error) {
        this.logger.error(e.stack);
      }
      throw new UnauthorizedException('Authentication failed');
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

  private async resolveTenantId(userId: string, email: string): Promise<string> {
    // 1. Try to find the user by clerkId OR email
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { clerkId: userId },
          { email: email }
        ]
      },
      select: { tenantId: true, id: true, clerkId: true }
    });

    if (existingUser) {
      // If found by email but missing clerkId, update it (Migration Case)
      if (!existingUser.clerkId) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { clerkId: userId }
        });
      }
      return existingUser.tenantId;
    }

    // 2. Check for DEFAULT_TENANT_ID as a fallback
    const configuredTenantId = this.config.get<string>('DEFAULT_TENANT_ID');
    if (configuredTenantId && configuredTenantId !== 'null' && configuredTenantId !== '') {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: configuredTenantId },
        select: { id: true },
      });
      if (tenant) {
        await this.prisma.user.create({
          data: {
            clerkId: userId,
            email,
            tenantId: tenant.id,
          },
        });
        return tenant.id;
      }
    }

    // 3. Create a new Tenant for this new User (Pure Multi-tenancy)
    const newTenant = await this.prisma.tenant.create({
      data: {
        name: `User ${userId.substring(0, 8)} Workspace`,
        apiKeyHash: hashApiKey(`clerk-${userId}-${Date.now()}`),
      },
      select: { id: true },
    });

    await this.prisma.user.create({
      data: {
        clerkId: userId,
        email,
        tenantId: newTenant.id,
      },
    });

    return newTenant.id;
  }
}
