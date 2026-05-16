import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TenantRateLimitGuard } from './guards/tenant-rate-limit.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [PassportModule, PrismaModule, NotificationsModule],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    ClerkAuthGuard,
    ApiKeyAuthGuard,
    TenantRateLimitGuard,
  ],
  exports: [
    JwtAuthGuard,
    ClerkAuthGuard,
    ApiKeyAuthGuard,
    TenantRateLimitGuard,
  ],
})
export class AuthModule {}
