import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { DocumentsModule } from '../documents/documents.module';
import { AiModule } from '../ai/ai.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 1 * 1024 * 1024, // 1MB limit for audio recordings
      },
    }),
    DocumentsModule,
    AiModule,
    RagModule,
  ],
  controllers: [VoiceController],
  providers: [VoiceService],
})
export class VoiceModule {}
