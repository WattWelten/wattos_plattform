import { Controller, Post, Body, Get } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchRequest } from './interfaces/search.interface';
import { SearchDto } from './dto/search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  async search(@Body() dto: SearchDto) {
    const request: SearchRequest = {
      knowledgeSpaceId: dto.knowledgeSpaceId,
      query: dto.query,
      topK: dto.topK,
      minScore: dto.minScore,
      filters: dto.filters,
    };

    return this.searchService.search(request);
  }

  @Get('health')
  async health() {
    return { status: 'ok', service: 'rag-service' };
  }
}


