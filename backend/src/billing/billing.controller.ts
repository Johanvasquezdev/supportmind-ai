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
}
