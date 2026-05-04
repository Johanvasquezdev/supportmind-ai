import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { RagModule } from '../rag/rag.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AiModule, RagModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
