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
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateDocumentDto) {
    return this.documents.create(tenantId, dto);
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
}
