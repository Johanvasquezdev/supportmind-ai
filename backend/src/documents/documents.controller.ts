import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { FileTextService } from './file-text.service';
import { TablesService } from './tables.service';
import { InsightsService } from './insights.service';

@UseGuards(ClerkAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documents: DocumentsService,
    private readonly fileText: FileTextService,
    private readonly tables: TablesService,
    private readonly insights: InsightsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateDocumentDto) {
    return this.documents.create(tenantId, dto);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const content = await this.fileText.extract(file);

    return this.documents.create(tenantId, {
      title: file.originalname,
      content,
    });
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.documents.findAll(tenantId);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.documents.findOne(tenantId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.documents.remove(tenantId, id);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  retry(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.documents.retry(tenantId, id);
  }

  @Get(':id/summary/text')
  async getTextSummary(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.documents.generateTextSummary(id, tenantId);
  }

  @Post(':id/summary/invalidate')
  @HttpCode(HttpStatus.OK)
  async invalidateSummary(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.documents.invalidateSummary(id, tenantId);
    return { success: true };
  }

  @Get(':id/tables')
  getTables(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.tables.extractTables(id, tenantId);
  }

  @Delete(':id/tables')
  @HttpCode(HttpStatus.OK)
  async deleteTables(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    const deleted = await this.tables.deleteTablesForDocument(id, tenantId);
    return { deleted };
  }

  @Get(':id/insights')
  getInsights(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.insights.extractInsights(id, tenantId);
  }

  @Delete(':id/insights')
  @HttpCode(HttpStatus.OK)
  async deleteInsights(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const deleted = await this.insights.deleteInsightsForDocument(id, tenantId);
    return { deleted };
  }
}
