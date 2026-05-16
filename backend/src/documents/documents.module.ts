import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { IngestionService } from './ingestion/ingestion.service';
import { ChunkingService } from './ingestion/chunking.service';
import { EmbeddingService } from './ingestion/embedding.service';
import { VectorService } from './ingestion/vector.service';
import { FileTextService } from './file-text.service';
import { AiModule } from '../ai/ai.module';
import { TablesService } from './tables.service';
import { InsightsService } from './insights.service';

@Module({
  imports: [AiModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    IngestionService,
    ChunkingService,
    EmbeddingService,
    VectorService,
    FileTextService,
    TablesService,
    InsightsService,
  ],
  // RAG module imports EmbeddingService + VectorService for query-time retrieval
  exports: [VectorService, EmbeddingService, DocumentsService],
})
export class DocumentsModule {}
