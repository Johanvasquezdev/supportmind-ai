import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { ApiLoggingInterceptor } from './api-logging.interceptor';
import { RagModule } from '../rag/rag.module';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { SearchModule } from '../search/search.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [RagModule, AiModule, AuthModule, SearchModule, DocumentsModule],
  controllers: [ApiController],
  providers: [ApiService, ApiLoggingInterceptor],
})
export class ApiModule {}
