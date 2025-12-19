import { Controller, Post, Body } from '@nestjs/common';
import { ContextService } from './context.service';
import { BuildContextDto } from './dto/build-context.dto';

@Controller('context')
export class ContextController {
  constructor(private readonly contextService: ContextService) {}

  @Post('build')
  async buildContext(@Body() dto: BuildContextDto) {
    return this.contextService.buildContext({
      searchResults: dto.searchResults,
      maxTokens: dto.maxTokens,
      includeMetadata: dto.includeMetadata,
    });
  }
}


