import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { KnowledgeEnhancementService } from './knowledge-enhancement.service';

/**
 * Knowledge Enhancement Controller
 * 
 * REST API für Knowledge Enhancement
 */
@Controller('knowledge-enhancement')
export class KnowledgeEnhancementController {
  constructor(private readonly knowledgeEnhancementService: KnowledgeEnhancementService) {}

  /**
   * Alle öffentlichen Quellen crawlen
   */
  @Post('crawl-all')
  async crawlAllPublicSources(@Query('tenantId') tenantId?: string) {
    return await this.knowledgeEnhancementService.crawlAllPublicSources(tenantId);
  }

  /**
   * Status abrufen
   */
  @Get('status')
  async getStatus() {
    return {
      status: 'active',
      publicSources: [
        { name: 'bund.de', baseUrl: 'https://www.bund.de', priority: 'high' },
        { name: 'niedersachsen.de', baseUrl: 'https://www.niedersachsen.de', priority: 'high' },
      ],
    };
  }
}


