import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule],
  providers: [JwtStrategy, JwtAuthGuard, ApiKeyAuthGuard],
  exports: [JwtAuthGuard, ApiKeyAuthGuard],
})
export class AuthModule {}
