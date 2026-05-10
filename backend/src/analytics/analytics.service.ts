import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  AnalyticsOverviewDto, 
  AnalyticsUsageDto, 
  AnalyticsConversationsDto 
} from './dto/analytics-overview.dto';
import { subDays, startOfDay } from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(tenantId: string): Promise<AnalyticsOverviewDto> {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const [
      messageCount,
      aiResponseCount,
      documentCount,
      usageStats
    ] = await Promise.all([
      // Total messages in last 30 days
      this.prisma.message.count({
        where: { tenantId, createdAt: { gte: thirtyDaysAgo } }
      }),
      // AI responses in last 30 days
      this.prisma.message.count({
        where: { tenantId, role: 'assistant', createdAt: { gte: thirtyDaysAgo } }
      }),
      // Total documents
      this.prisma.document.count({
        where: { tenantId }
      }),
      // Token usage and response time
      this.prisma.usage.aggregate({
        where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
        _sum: {
          inputTokens: true,
          outputTokens: true
        },
        _avg: {
          responseTimeMs: true
        }
      })
    ]);

    const totalTokens = (usageStats._sum.inputTokens || 0) + (usageStats._sum.outputTokens || 0);

    return {
      totalMessages: messageCount,
      aiResponses: aiResponseCount,
      documentsUploaded: documentCount,
      totalTokens: totalTokens,
      averageResponseTimeMs: Math.round(usageStats._avg.responseTimeMs || 0)
    };
  }

  async getUsage(tenantId: string): Promise<AnalyticsUsageDto> {
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));

    // Get daily usage data and message volume over time in parallel
    const [usageData, messageData] = await Promise.all([
      this.prisma.usage.findMany({
        where: {
          tenantId,
          createdAt: { gte: thirtyDaysAgo }
        },
        select: {
          inputTokens: true,
          outputTokens: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),
      this.prisma.message.findMany({
        where: {
          tenantId,
          createdAt: { gte: thirtyDaysAgo }
        },
        select: {
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
    ]);

    // Group by date
    const dailyMap = new Map<string, { tokens: number; messages: number }>();

    // Initialize map with last 30 days
    for (let i = 0; i < 30; i++) {
      const date = startOfDay(subDays(new Date(), i)).toISOString().split('T')[0];
      dailyMap.set(date, { tokens: 0, messages: 0 });
    }

    usageData.forEach(u => {
      const date = u.createdAt.toISOString().split('T')[0];
      if (dailyMap.has(date)) {
        const current = dailyMap.get(date)!;
        current.tokens += u.inputTokens + u.outputTokens;
      }
    });

    messageData.forEach(m => {
      const date = m.createdAt.toISOString().split('T')[0];
      if (dailyMap.has(date)) {
        const current = dailyMap.get(date)!;
        current.messages += 1;
      }
    });

    const dataPoints = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        tokens: stats.tokens,
        messages: stats.messages
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      data: dataPoints,
      totalTokens: dataPoints.reduce((acc, curr) => acc + curr.tokens, 0)
    };
  }

  async getConversations(tenantId: string): Promise<AnalyticsConversationsDto> {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        tenantId,
        createdAt: { gte: thirtyDaysAgo }
      },
      include: {
        _count: {
          select: { messages: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    const metrics = conversations.map(c => ({
      id: c.id,
      messageCount: c._count.messages,
      createdAt: c.createdAt,
      lastMessageAt: c.messages[0]?.createdAt || c.createdAt
    }));

    return {
      conversations: metrics,
      totalConversations: conversations.length
    };
  }

  async getDocumentInsights(tenantId: string) {
    const documents = await this.prisma.document.findMany({
      where: { tenantId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        _count: {
          select: { chunks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // In a real scenario, we'd track "references" in messages. 
    // Since we don't have a 'referencedIn' relation yet, 
    // we'll return documents with their status and size.
    return documents.map(d => ({
      id: d.id,
      title: d.title || 'Untitled',
      status: d.status,
      chunkCount: d._count.chunks,
      createdAt: d.createdAt
    }));
  }

  async getKnowledgeHealth(tenantId: string) {
    const [totalDocs, readyDocs, failedDocs, totalChunks] = await Promise.all([
      this.prisma.document.count({ where: { tenantId } }),
      this.prisma.document.count({ where: { tenantId, status: 'READY' } }),
      this.prisma.document.count({ where: { tenantId, status: 'FAILED' } }),
      this.prisma.documentChunk.count({ where: { tenantId } })
    ]);

    const coveragePercentage = totalDocs > 0 ? (readyDocs / totalDocs) * 100 : 0;
    const healthScore = totalDocs > 0 ? 100 - ((failedDocs / totalDocs) * 100) : 100;

    return {
      healthScore: Math.round(healthScore),
      coveragePercentage: Math.round(coveragePercentage),
      totalChunks,
      failedDocs,
      readyDocs,
      totalDocs
    };
  }
}
