import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('campaign')
  @UseGuards(ClerkAuthGuard)
  async createCampaign(@Body() createCampaignDto: CreateCampaignDto) {
    return this.notificationsService.createEmailCampaign(createCampaignDto);
  }

  @Post('test-email')
  async testEmail(@Body('email') email: string) {
    await this.notificationsService.sendWelcomeEmail(email, 'Test User');
    return { message: `Test email sent to ${email}` };
  }
}
