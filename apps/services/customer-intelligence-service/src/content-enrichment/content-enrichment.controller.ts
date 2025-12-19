import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ContentEnrichmentService } from './content-enrichment.service';
import { EnrichContentDto } from './dto/enrich-content.dto';

@Controller('api/v1/analytics')
export class ContentEnrichmentController {
  constructor(private readonly contentEnrichmentService: ContentEnrichmentService) {}

  @Post('enrich-content')
  async enrichContent(@Body() dto: EnrichContentDto) {
    return this.contentEnrichmentService.enrichContent(dto);
  }

  @Get('target-groups/:id/enriched-content')
  async getEnrichedContent(
    @Param('id') id: string,
    @Query('minScore') minScore?: string,
  ) {
    const minRelevanceScore = minScore ? parseFloat(minScore) : 0.5;
    return this.contentEnrichmentService.getEnrichedContent(id, minRelevanceScore);
  }
}














