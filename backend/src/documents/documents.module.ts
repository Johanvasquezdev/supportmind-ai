import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { IngestionService } from './ingestion/ingestion.service';
import { ChunkingService } from './ingestion/chunking.service';
import { EmbeddingService } from './ingestion/embedding.service';
import { VectorService } from './ingestion/vector.service';

@Module({
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    IngestionService,
    ChunkingService,
    EmbeddingService,
    VectorService,
  ],
  // Chat module will import these two to perform RAG at query time
  exports: [VectorService, EmbeddingService],
})
export class DocumentsModule {}
