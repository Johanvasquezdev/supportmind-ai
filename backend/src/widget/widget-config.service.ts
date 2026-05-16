import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WidgetConfigDto } from './dto/widget-config.dto';

export interface WidgetConfigResponse {
  id: string;
  tenantId: string;
  primaryColor: string;
  position: string;
  placeholder: string;
  title: string;
  welcomeMessage: string;
  isEnabled: boolean;
  allowedOrigins: string[];
}

export interface WidgetStatsResponse {
  totalSessions: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  topQuestions: string[];
}

@Injectable()
export class WidgetConfigService {
  private readonly logger = new Logger(WidgetConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsertConfig(
    tenantId: string,
    dto: WidgetConfigDto,
  ): Promise<WidgetConfigResponse> {
    const data: Record<string, unknown> = {};

    if (dto.primaryColor !== undefined) data.primaryColor = dto.primaryColor;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.placeholder !== undefined) data.placeholder = dto.placeholder;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.welcomeMessage !== undefined) data.welcomeMessage = dto.welcomeMessage;
    if (dto.isEnabled !== undefined) data.isEnabled = dto.isEnabled;
    if (dto.allowedOrigins !== undefined) data.allowedOrigins = dto.allowedOrigins;

    const config = await this.prisma.widgetConfig.upsert({
      where: { tenantId },
      create: { tenantId, ...data },
      update: data,
    });

    this.logger.log(`Widget config upserted for tenant ${tenantId.slice(0, 8)}`);
    return config;
  }

  async getConfig(tenantId: string): Promise<WidgetConfigResponse> {
    const config = await this.prisma.widgetConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      // Return defaults without persisting
      return {
        id: '',
        tenantId,
        primaryColor: '#7c3aed',
        position: 'bottom-right',
        placeholder: 'Ask us anything...',
        title: 'Support',
        welcomeMessage: 'Hi! How can I help you today?',
        isEnabled: true,
        allowedOrigins: [],
      };
    }

    return config;
  }

  async getStats(tenantId: string): Promise<WidgetStatsResponse> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalSessions, totalMessages, topQuestionsRaw] = await Promise.all([
      this.prisma.widgetSession.count({
        where: {
          tenantId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.widgetMessage.count({
        where: {
          tenantId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.widgetMessage.findMany({
        where: {
          tenantId,
          role: 'user',
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { content: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const avgMessagesPerSession =
      totalSessions > 0
        ? Math.round((totalMessages / totalSessions) * 10) / 10
        : 0;

    // Simple frequency-based top questions (first messages)
    const questionFreq = new Map<string, number>();
    for (const msg of topQuestionsRaw) {
      const normalized = msg.content.trim().toLowerCase().slice(0, 80);
      questionFreq.set(normalized, (questionFreq.get(normalized) ?? 0) + 1);
    }

    const topQuestions = [...questionFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([q]) => q.charAt(0).toUpperCase() + q.slice(1));

    return {
      totalSessions,
      totalMessages,
      avgMessagesPerSession,
      topQuestions,
    };
  }
}
