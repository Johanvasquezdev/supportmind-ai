import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { SearchDto, SuggestDto } from './dto/search.dto';
import { SearchService } from './search.service';

@UseGuards(ClerkAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  search(@CurrentTenant() tenantId: string, @Body() dto: SearchDto) {
    return this.searchService.hybridSearch(dto.query, tenantId, {
      limit: dto.limit,
    });
  }

  @Get('suggest')
  suggest(@CurrentTenant() tenantId: string, @Query() query: SuggestDto) {
    return this.searchService.suggest(query.q, tenantId);
  }
}
