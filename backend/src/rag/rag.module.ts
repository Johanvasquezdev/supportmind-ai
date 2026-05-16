import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [SearchModule],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
