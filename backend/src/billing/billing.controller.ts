import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

type AuthenticatedRequest = {
  user: {
    userId: string;
    email?: string;
  };
};

@UseGuards(ClerkAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('checkout-session')
  createCheckoutSession(
    @CurrentTenant() tenantId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.billing.createCheckoutSession({
      plan: dto.plan,
      tenantId,
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Post('webhooks/stripe')
  async handleStripeWebhook(@Body() body: any) {
    const event = body;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_details?.email;
      const name = session.customer_details?.name || 'Customer';
      const plan = session.metadata?.plan || 'Standard';
      const amount = (session.amount_total / 100).toFixed(2);
      const currency = session.currency.toUpperCase();
      const phone = session.customer_details?.phone;

      if (email) {
        await this.billing.handleSuccessfulPayment(email, name, plan, `${amount} ${currency}`, phone);
      }
    }

    return { received: true };
  }
}
