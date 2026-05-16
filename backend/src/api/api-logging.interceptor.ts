import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

interface AuthenticatedRequest extends Request {
  user?: {
    tenantId: string;
  };
}

@Injectable()
export class ApiLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiLoggingInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): any {
    const startedAt = Date.now();
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<AuthenticatedRequest>();
    const response = httpCtx.getResponse<Response>();
    const requestId = randomUUID();

    // Attach standard headers
    response.setHeader('X-API-Version', '1.0.0');
    response.setHeader('X-Request-Id', requestId);

    return (next.handle() as any).pipe(
      tap(() => {
        const latencyMs = Date.now() - startedAt;
        const tenantId = request.user?.tenantId;

        if (tenantId) {
          this.logRequest(
            tenantId,
            request.path,
            request.method,
            response.statusCode,
            latencyMs,
          ).catch((e) =>
            this.logger.error(`Failed to log API request: ${e.message}`),
          );
        }
      }),
      catchError((error: any) => {
        const latencyMs = Date.now() - startedAt;
        const tenantId = request.user?.tenantId;

        if (tenantId) {
          this.logRequest(
            tenantId,
            request.path,
            request.method,
            error.status ?? 500,
            latencyMs,
          ).catch((e) =>
            this.logger.error(`Failed to log API request error: ${e.message}`),
          );
        }

        return throwError(() => error);
      }),
    ) as any;
  }

  private async logRequest(
    tenantId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    latencyMs: number,
  ): Promise<void> {
    try {
      await this.prisma.apiRequest.create({
        data: {
          tenantId,
          endpoint,
          method,
          statusCode,
          latencyMs,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to persist API request log: ${error}`);
    }
  }
}
