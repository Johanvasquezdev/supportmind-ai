import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { IngestionService } from './ingestion/ingestion.service';
import { ChunkingService } from './ingestion/chunking.service';
import { EmbeddingService } from './ingestion/embedding.service';
import { VectorService } from './ingestion/vector.service';
import { FileTextService } from './file-text.service';

@Module({
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    IngestionService,
    ChunkingService,
    EmbeddingService,
    VectorService,
    FileTextService,
  ],
  // RAG module imports EmbeddingService + VectorService for query-time retrieval
  exports: [VectorService, EmbeddingService],
})
export class DocumentsModule {}
