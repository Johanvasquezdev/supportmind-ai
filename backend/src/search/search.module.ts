import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchController } from './search.controller';
import { SearchMigrationService } from './search-migration.service';
import { SearchService } from './search.service';

@Module({
  imports: [PrismaModule, DocumentsModule],
  controllers: [SearchController],
  providers: [SearchService, SearchMigrationService],
  exports: [SearchService],
})
export class SearchModule {}
