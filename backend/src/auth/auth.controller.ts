import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly notificationsService: NotificationsService) {}

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
