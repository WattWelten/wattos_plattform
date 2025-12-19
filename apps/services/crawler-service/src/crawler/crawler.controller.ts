import { Controller, Post, Get, Body, Param, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { CrawlerService } from './crawler.service';
import { StartCrawlDto } from './dto/start-crawl.dto';

@Controller('api/v1/crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('start')
  async startCrawl(@Req() req: Request, @Body() dto: StartCrawlDto) {
    // Tenant-ID aus Request oder Body verwenden
    const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] || dto.tenantId;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return this.crawlerService.startCrawl({
      ...dto,
      tenantId,
    });
  }

  @Get('status/:crawlId')
  async getCrawlStatus(@Param('crawlId') crawlId: string) {
    const status = this.crawlerService.getCrawlStatus(crawlId);
    if (!status) {
      throw new Error(`Crawl ${crawlId} not found`);
    }
    return status;
  }

  @Get('data')
  async getCrawlerData(@Req() req: Request, @Query('tenantId') tenantId?: string) {
    const effectiveTenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] || tenantId;
    if (!effectiveTenantId) {
      throw new Error('Tenant ID is required');
    }

    const crawls = this.crawlerService.getCrawlsForTenant(effectiveTenantId);
    // Alle gecrawlten Seiten zusammenfassen
    const allPages = crawls.flatMap(crawl => crawl.pages);
    return {
      pages: allPages,
      totalPages: allPages.length,
      crawls: crawls.length,
    };
  }
}














