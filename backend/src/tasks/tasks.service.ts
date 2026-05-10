import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleTrialExpiration() {
    this.logger.log('Running daily trial expiration check...');
    const now = new Date();

    // 1. Handle Trial Ending Notifications (7, 3, 1 days away)
    const trialingSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'trialing',
        currentPeriodEnd: {
          not: null,
          gt: now,
        },
      },
      include: {
        tenant: {
          include: {
            users: true,
          },
        },
      },
    });

    for (const sub of trialingSubscriptions) {
      if (!sub.currentPeriodEnd) continue;

      const diffTime = sub.currentPeriodEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const trialEndingDays = new Set([7, 3, 1]);
      if (trialEndingDays.has(diffDays)) {
        for (const user of sub.tenant.users) {
          const name = user.email.split('@')[0]; // Fallback name
          await this.notifications.sendTrialEndingEmail(user.email, name, diffDays);
          if (user.phone) {
            await this.notifications.sendTrialEndingSMS(user.phone, diffDays);
          }
        }
      }
    }

    // 2. Handle Expired Trials
    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'trialing',
        currentPeriodEnd: {
          not: null,
          lt: now,
        },
      },
      include: {
        tenant: {
          include: {
            users: true,
          },
        },
      },
    });

    for (const sub of expiredSubscriptions) {
      this.logger.log(`Subscription for tenant ${sub.tenantId} has expired.`);

      // Update status to expired
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      });

      // Notify users
      for (const user of sub.tenant.users) {
        const name = user.email.split('@')[0];
        await this.notifications.sendTrialExpiredEmail(user.email, name);
      }
    }

    this.logger.log('Daily trial expiration check completed.');
  }
}
