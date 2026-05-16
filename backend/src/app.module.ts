import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AiModule } from './ai/ai.module';
import { ApiModule } from './api/api.module';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { ChatModule } from './chat/chat.module';
import { DocumentsModule } from './documents/documents.module';
import { PrismaModule } from './prisma/prisma.module';
import { RagModule } from './rag/rag.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TasksModule } from './tasks/tasks.module';
import { VoiceModule } from './voice/voice.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SearchModule } from './search/search.module';
import { WidgetModule } from './widget/widget.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    BillingModule,
    DocumentsModule,
    RagModule,
    AiModule,
    ChatModule,
    NotificationsModule,
    TasksModule,
    VoiceModule,
    AnalyticsModule,
    SearchModule,
    WidgetModule,
    ApiModule,
  ],
})
export class AppModule {}
