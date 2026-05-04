import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { RagService } from './rag.service';

@Module({
  imports: [DocumentsModule],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
