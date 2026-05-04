import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

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
    const apiKey = this.extractApiKey(request);

    if (!apiKey || apiKey.length < ApiKeyAuthGuard.MIN_API_KEY_LENGTH) {
      throw new UnauthorizedException('Invalid API key');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: {
        apiKey,
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
