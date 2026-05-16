import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyAuthGuard } from '../auth/guards/api-key-auth.guard';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { WidgetService } from './widget.service';
import { WidgetConfigService } from './widget-config.service';
import { WidgetChatDto } from './dto/widget-chat.dto';
import { WidgetConfigDto } from './dto/widget-config.dto';

// ─── Widget Routes (API-key auth, external origins) ─────────────────────────

@Controller('widget')
@UseGuards(ApiKeyAuthGuard)
export class WidgetController {
  constructor(
    private readonly widgetService: WidgetService,
    private readonly widgetConfigService: WidgetConfigService,
  ) {}

  @Post('chat')
  async chat(
    @Body() dto: WidgetChatDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.widgetService.chat(dto, tenantId);
  }

  @Get('history/:sessionId')
  async getHistory(
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.widgetService.getHistory(sessionId, tenantId);
  }

  @Get('config')
  async getConfig(@CurrentTenant() tenantId: string) {
    return this.widgetService.getConfig(tenantId);
  }
}

// ─── Widget Admin Routes (Clerk auth, dashboard users) ──────────────────────

@Controller('widget-admin')
@UseGuards(ClerkAuthGuard)
export class WidgetAdminController {
  constructor(private readonly widgetConfigService: WidgetConfigService) {}

  @Get('config')
  async getConfig(@CurrentTenant() tenantId: string) {
    return this.widgetConfigService.getConfig(tenantId);
  }

  @Put('config')
  async updateConfig(
    @CurrentTenant() tenantId: string,
    @Body() dto: WidgetConfigDto,
  ) {
    return this.widgetConfigService.upsertConfig(tenantId, dto);
  }

  @Get('stats')
  async getStats(@CurrentTenant() tenantId: string) {
    return this.widgetConfigService.getStats(tenantId);
  }
}
