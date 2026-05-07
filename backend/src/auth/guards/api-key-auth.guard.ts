import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { hashApiKey } from '../api-key.util';

type ApiKeyRequest = Request & {
  user?: {
    authType: 'apiKey';
    tenantId: string;
  };
};

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  private static readonly MIN_API_KEY_LENGTH = 16;

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ApiKeyRequest>();
    const rawKey = this.extractApiKey(request);

    if (!rawKey || rawKey.length < ApiKeyAuthGuard.MIN_API_KEY_LENGTH) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Hash the incoming key, then look up by hash.
    // The raw key is NEVER stored or logged.
    const keyHash = hashApiKey(rawKey);

    const tenant = await this.prisma.tenant.findUnique({
      where: {
        apiKeyHash: keyHash,
      },
      select: {
        id: true,
      },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.user = {
      authType: 'apiKey',
      tenantId: tenant.id,
    };

    return true;
  }

  private extractApiKey(request: Request): string | undefined {
    const headerValue = request.header('x-api-key');
    return headerValue?.trim();
  }
}
