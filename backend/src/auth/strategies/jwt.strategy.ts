import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

type JwtPayload = {
  sub: string;
  email?: string;
  tenantId: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Verify the tenant still exists in the database.
    // A signed token with a deleted/suspended tenant must be rejected.
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      select: { id: true },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant not found');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: tenant.id, // use the DB value, not the raw token claim
    };
  }
}
