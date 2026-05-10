import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';

type BillingPlan = 'basic' | 'pro';

type CheckoutSessionResponse = {
  id: string;
  url: string | null;
};

@Injectable()
export class BillingService {
  constructor(
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async handleSuccessfulPayment(email: string, name: string, plan: string, amount: string, phone?: string) {
    await this.notifications.sendPlanConfirmationEmail(email, name, plan, amount);
    if (phone) {
      await this.notifications.sendPlanActivatedSMS(phone, plan);
    }
  }

  async createCheckoutSession(input: {
    plan: BillingPlan;
    tenantId: string;
    userId: string;
    email?: string;
  }): Promise<{ url: string }> {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    const priceId = this.getPriceId(input.plan);

    if (!secretKey || !priceId) {
      throw new ServiceUnavailableException(
        'Stripe is not configured for this plan',
      );
    }

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const body = new URLSearchParams({
      mode: 'subscription',
      success_url: `${frontendUrl}/billing?checkout=success`,
      cancel_url: `${frontendUrl}/billing?checkout=cancelled`,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'metadata[tenantId]': input.tenantId,
      'metadata[userId]': input.userId,
      'subscription_data[metadata][tenantId]': input.tenantId,
      'subscription_data[metadata][userId]': input.userId,
      allow_promotion_codes: 'true',
    });

    if (input.email) {
      body.set('customer_email', input.email);
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Stripe checkout failed: ${error}`);
    }

    const session = (await response.json()) as CheckoutSessionResponse;

    if (!session.url) {
      throw new BadRequestException('Stripe did not return a checkout URL');
    }

    return { url: session.url };
  }

  private getPriceId(plan: BillingPlan): string | undefined {
    if (plan === 'basic') {
      return this.config.get<string>('STRIPE_BASIC_PRICE_ID');
    }

    return this.config.get<string>('STRIPE_PRO_PRICE_ID');
  }
}
