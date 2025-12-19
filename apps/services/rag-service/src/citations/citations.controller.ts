import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CitationsService } from './citations.service';
import { GenerateCitationsDto } from './dto/generate-citations.dto';

@Controller('citations')
export class CitationsController {
  constructor(private readonly citationsService: CitationsService) {}

  @Post('generate')
  async generateCitations(@Body() dto: GenerateCitationsDto) {
    return this.citationsService.generateCitations({
      chunkIds: dto.chunkIds,
      scores: dto.scores,
    });
  }

  @Post('format/markdown')
  async formatMarkdown(@Body() body: { citations: any[] }) {
    return {
      formatted: this.citationsService.formatCitationsForMarkdown(body.citations),
    };
  }

  @Post('format/json')
  async formatJSON(@Body() body: { citations: any[] }) {
    return {
      formatted: this.citationsService.formatCitationsForJSON(body.citations),
    };
  }
}


