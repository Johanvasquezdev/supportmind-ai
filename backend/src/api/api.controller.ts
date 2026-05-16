import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiKeyAuthGuard } from '../auth/guards/api-key-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { ApiService } from './api.service';
import { ApiChatDto } from './dto/api-chat.dto';
import { ApiSearchDto } from './dto/api-search.dto';
import { ApiLoggingInterceptor } from './api-logging.interceptor';

@Controller('api/v1')
@UseGuards(ApiKeyAuthGuard)
@UseInterceptors(ApiLoggingInterceptor)
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post('chat')
  async chat(
    @Body() dto: ApiChatDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.apiService.chat(dto, tenantId);
  }

  @Post('search')
  async search(
    @Body() dto: ApiSearchDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.apiService.search(dto, tenantId);
  }

  @Get('documents')
  async listDocuments(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.apiService.listDocuments(
      tenantId,
      status,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('documents/:id/summary')
  async getDocumentSummary(
    @CurrentTenant() tenantId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.apiService.getDocumentSummary(tenantId, id);
  }

  @Get('usage')
  async getUsage(@CurrentTenant() tenantId: string) {
    return this.apiService.getUsage(tenantId);
  }

  @Get('health')
  async health() {
    return {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
