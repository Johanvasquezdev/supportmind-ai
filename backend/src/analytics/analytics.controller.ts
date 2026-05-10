import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { AnalyticsService } from './analytics.service';
import { 
  AnalyticsOverviewDto, 
  AnalyticsUsageDto, 
  AnalyticsConversationsDto 
} from './dto/analytics-overview.dto';

@UseGuards(ClerkAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview(@CurrentTenant() tenantId: string): Promise<AnalyticsOverviewDto> {
    return this.analyticsService.getOverview(tenantId);
  }

  @Get('usage')
  getUsage(@CurrentTenant() tenantId: string): Promise<AnalyticsUsageDto> {
    return this.analyticsService.getUsage(tenantId);
  }

  @Get('conversations')
  getConversations(@CurrentTenant() tenantId: string): Promise<AnalyticsConversationsDto> {
    return this.analyticsService.getConversations(tenantId);
  }

  @Get('documents')
  getDocuments(@CurrentTenant() tenantId: string) {
    return this.analyticsService.getDocumentInsights(tenantId);
  }

  @Get('health')
  getHealth(@CurrentTenant() tenantId: string) {
    return this.analyticsService.getKnowledgeHealth(tenantId);
  }
}
