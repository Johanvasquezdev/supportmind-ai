import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DocumentInsight, InsightType } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';

interface InsightCandidate {
  type?: unknown;
  label?: unknown;
  value?: unknown;
  unit?: unknown;
  context?: unknown;
}

interface ExtractedInsight {
  type: InsightType;
  label: string;
  value: string;
  unit: string | null;
  context: string | null;
}

const MAX_INSIGHTS = 12;
const MAX_INSIGHT_INPUT_CHARS = 18_000;
const INSIGHT_TYPES = new Set<string>(Object.values(InsightType));

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async extractInsights(
    documentId: string,
    tenantId: string,
  ): Promise<DocumentInsight[]> {
    const startedAt = Date.now();
    const existing = await this.prisma.documentInsight.findMany({
      where: { documentId, tenantId },
      orderBy: { extractedAt: 'asc' },
    });

    if (existing.length > 0) {
      return existing;
    }

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, tenantId },
      select: { id: true, content: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const prompt = this.buildPrompt(document.content.slice(0, MAX_INSIGHT_INPUT_CHARS));
    const rawResponse = await this.ai.generateSummary(prompt);
    const insights = this.parseInsights(rawResponse).slice(0, MAX_INSIGHTS);

    if (insights.length === 0) {
      this.logger.log(
        `Extracted 0 insights for document ${documentId} in ${Date.now() - startedAt}ms`,
      );
      return [];
    }

    await this.prisma.documentInsight.createMany({
      data: insights.map((insight) => ({
        tenantId,
        documentId,
        type: insight.type,
        label: insight.label,
        value: insight.value,
        unit: insight.unit,
        context: insight.context,
      })),
    });

    const saved = await this.prisma.documentInsight.findMany({
      where: { documentId, tenantId },
      orderBy: { extractedAt: 'asc' },
    });

    this.logger.log(
      `Extracted ${saved.length} insights for document ${documentId} in ${Date.now() - startedAt}ms`,
    );

    return saved;
  }

  async deleteInsightsForDocument(
    documentId: string,
    tenantId: string,
  ): Promise<number> {
    const { count } = await this.prisma.documentInsight.deleteMany({
      where: { documentId, tenantId },
    });
    return count;
  }

  private buildPrompt(content: string): string {
    return [
      'You are a business intelligence analyst.',
      'Extract the most important data points, metrics, facts, and key information from this document.',
      '',
      'For each insight found, return a JSON object with:',
      '- type: one of METRIC, FACT, DATE, PERSON, PROCESS, REQUIREMENT',
      '- label: short descriptive label (max 40 chars)',
      '- value: the actual value or statement (max 100 chars)',
      '- unit: unit of measurement if applicable, else null',
      '- context: one sentence of context (max 150 chars), else null',
      '',
      'Return ONLY a valid JSON array.',
      'Maximum 12 insights.',
      'Focus on the most important and specific information.',
      'Skip generic statements.',
      'Do not include markdown or explanation.',
      '',
      `Document:\n${content}`,
    ].join('\n');
  }

  private parseInsights(response: string): ExtractedInsight[] {
    try {
      const parsed: unknown = JSON.parse(this.cleanJson(response));
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item) => this.normalizeInsight(item))
        .filter((insight): insight is ExtractedInsight => insight !== null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown parse error';
      this.logger.warn(`Failed to parse insight extraction JSON: ${message}`);
      return [];
    }
  }

  private cleanJson(response: string): string {
    return response
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();
  }

  private normalizeInsight(value: unknown): ExtractedInsight | null {
    if (!value || typeof value !== 'object') return null;

    const candidate = value as InsightCandidate;
    if (
      typeof candidate.type !== 'string' ||
      !INSIGHT_TYPES.has(candidate.type) ||
      typeof candidate.label !== 'string' ||
      typeof candidate.value !== 'string'
    ) {
      return null;
    }

    const label = candidate.label.trim().slice(0, 40);
    const insightValue = candidate.value.trim().slice(0, 100);
    if (!label || !insightValue) return null;

    return {
      type: candidate.type as InsightType,
      label,
      value: insightValue,
      unit:
        typeof candidate.unit === 'string' && candidate.unit.trim()
          ? candidate.unit.trim().slice(0, 40)
          : null,
      context:
        typeof candidate.context === 'string' && candidate.context.trim()
          ? candidate.context.trim().slice(0, 150)
          : null,
    };
  }
}
