import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DocumentTable, Prisma } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';

interface ExtractedTable {
  title: string | null;
  headers: string[];
  rows: Prisma.InputJsonValue;
}

interface TableCandidate {
  title?: unknown;
  headers?: unknown;
  rows?: unknown;
}

const MAX_TABLE_INPUT_CHARS = 18_000;

@Injectable()
export class TablesService {
  private readonly logger = new Logger(TablesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async extractTables(documentId: string, tenantId: string): Promise<DocumentTable[]> {
    const startedAt = Date.now();
    const existing = await this.prisma.documentTable.findMany({
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

    const prompt = this.buildPrompt(document.content.slice(0, MAX_TABLE_INPUT_CHARS));
    const rawResponse = await this.ai.generateSummary(prompt);
    const tables = this.parseTables(rawResponse);

    if (tables.length === 0) {
      this.logger.log(
        `Extracted 0 tables for document ${documentId} in ${Date.now() - startedAt}ms`,
      );
      return [];
    }

    await this.prisma.documentTable.createMany({
      data: tables.map((table) => ({
        tenantId,
        documentId,
        title: table.title,
        headers: table.headers,
        rows: table.rows,
      })),
    });

    const saved = await this.prisma.documentTable.findMany({
      where: { documentId, tenantId },
      orderBy: { extractedAt: 'asc' },
    });

    this.logger.log(
      `Extracted ${saved.length} tables for document ${documentId} in ${Date.now() - startedAt}ms`,
    );

    return saved;
  }

  async deleteTablesForDocument(
    documentId: string,
    tenantId: string,
  ): Promise<number> {
    const { count } = await this.prisma.documentTable.deleteMany({
      where: { documentId, tenantId },
    });
    return count;
  }

  private buildPrompt(content: string): string {
    return [
      'You are a data extraction specialist.',
      'Analyze the following document and extract ALL tables you can find.',
      '',
      'For each table found, return a JSON object with:',
      '- title: descriptive name for the table (or null)',
      '- headers: array of column header strings',
      '- rows: array of arrays, each inner array is one row',
      '',
      'Return ONLY a valid JSON array of table objects.',
      'If no tables exist, return an empty array [].',
      'Do not include any explanation or markdown.',
      'Do not wrap in code blocks.',
      '',
      'Example output:',
      '[',
      '  {',
      '    "title": "Sales by Region",',
      '    "headers": ["Region", "Q1", "Q2", "Total"],',
      '    "rows": [[',
      '      "North", "120", "150", "270"',
      '    ]]',
      '  }',
      ']',
      '',
      `Document:\n${content}`,
    ].join('\n');
  }

  private parseTables(response: string): ExtractedTable[] {
    try {
      const parsed: unknown = JSON.parse(this.cleanJson(response));
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item) => this.normalizeTable(item))
        .filter((table): table is ExtractedTable => table !== null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown parse error';
      this.logger.warn(`Failed to parse table extraction JSON: ${message}`);
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

  private normalizeTable(value: unknown): ExtractedTable | null {
    if (!value || typeof value !== 'object') return null;

    const candidate = value as TableCandidate;
    if (!Array.isArray(candidate.headers) || !Array.isArray(candidate.rows)) {
      return null;
    }

    const headers = candidate.headers.filter(
      (header): header is string => typeof header === 'string' && header.trim().length > 0,
    );

    const rows = candidate.rows
      .filter((row): row is unknown[] => Array.isArray(row))
      .map((row) => row.map((cell) => this.toJsonCell(cell)));

    if (headers.length === 0 || rows.length === 0) return null;

    return {
      title: typeof candidate.title === 'string' ? candidate.title : null,
      headers,
      rows: rows as Prisma.InputJsonValue,
    };
  }

  private toJsonCell(value: unknown): string | number | boolean | null {
    if (value === null) return null;

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    return String(value);
  }
}
