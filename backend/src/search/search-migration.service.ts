import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ColumnExistsRow {
  exists: boolean;
}

@Injectable()
export class SearchMigrationService implements OnModuleInit {
  private readonly logger = new Logger(SearchMigrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const startedAt = Date.now();

    const [column] = await this.prisma.$queryRaw<ColumnExistsRow[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'DocumentChunk'
          AND column_name = 'search_vector'
      ) AS "exists"
    `;

    if (column?.exists) {
      this.logger.log('DocumentChunk search_vector column already exists');
      return;
    }

    await this.prisma.$executeRaw`
      ALTER TABLE "DocumentChunk"
      ADD COLUMN IF NOT EXISTS search_vector tsvector
    `;

    await this.prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS document_chunk_search_idx
      ON "DocumentChunk" USING GIN(search_vector)
    `;

    await this.prisma.$executeRaw`
      UPDATE "DocumentChunk"
      SET search_vector = to_tsvector('english', text)
      WHERE search_vector IS NULL
    `;

    await this.prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_search_vector()
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english', NEW.text);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;

    await this.prisma.$executeRaw`
      DROP TRIGGER IF EXISTS search_vector_trigger
      ON "DocumentChunk"
    `;

    await this.prisma.$executeRaw`
      CREATE TRIGGER search_vector_trigger
      BEFORE INSERT OR UPDATE ON "DocumentChunk"
      FOR EACH ROW EXECUTE FUNCTION update_search_vector()
    `;

    this.logger.log(
      `DocumentChunk full-text search migration completed in ${Date.now() - startedAt}ms`,
    );
  }
}
