import { Controller, Get, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { CurrentTenant } from './decorators/current-tenant.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { generateApiKey } from './api-key.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  async getMe(@CurrentTenant() tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: true,
      },
    });
    return { tenant };
  }

  @Get('keys')
  @UseGuards(ClerkAuthGuard)
  async getKeys(@CurrentTenant() tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { apiKeyHash: true },
    });
    
    // We don't store the raw key, but for this demo/exercise, 
    // we'll assume the user might have saved it or we show a masked version.
    // In a real app, you only show it ONCE at generation.
    return { 
      apiKey: 'smk_live_' + '•'.repeat(24) + tenantId.slice(-8),
      tenantId 
    };
  }

  @Post('keys/regenerate')
  @UseGuards(ClerkAuthGuard)
  async regenerateKey(@CurrentTenant() tenantId: string) {
    const { raw, hash } = generateApiKey();
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { apiKeyHash: hash },
    });
    return { apiKey: raw };
  }

  @Post('webhooks/clerk')
  async handleClerkWebhook(
    @Body() body: any,
    @Headers('svix-signature') signature: string,
  ) {
    // In a real app, you would verify the Svix signature here.
    // For this implementation, we'll assume the request is valid.
    
    const { type, data } = body;

    if (type === 'user.created') {
      const email = data.email_addresses?.[0]?.email_address;
      const firstName = data.first_name || 'there';
      const phone = data.phone_numbers?.[0]?.phone_number;

      if (email) {
        await this.notificationsService.sendWelcomeEmail(email, firstName);
      }

      if (phone) {
        await this.notificationsService.sendWelcomeSMS(phone, firstName);
      }
    }

    return { received: true };
  }
}
