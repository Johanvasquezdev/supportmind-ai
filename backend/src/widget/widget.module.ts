import { Module } from '@nestjs/common';
import { WidgetController, WidgetAdminController } from './widget.controller';
import { WidgetService } from './widget.service';
import { WidgetConfigService } from './widget-config.service';
import { RagModule } from '../rag/rag.module';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RagModule, AiModule, AuthModule],
  controllers: [WidgetController, WidgetAdminController],
  providers: [WidgetService, WidgetConfigService],
})
export class WidgetModule {}
