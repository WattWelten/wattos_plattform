import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CrawlerEngineService } from './crawler-engine.service';
import { CrawlResult } from './interfaces/crawled-page.interface';
import { StartCrawlDto } from './dto/start-crawl.dto';
import { ServiceDiscoveryService } from '@wattweiser/shared';
export declare class CrawlerService {
    private readonly configService;
    private readonly httpService;
    private readonly crawlerEngine;
    private readonly serviceDiscovery;
    private readonly logger;
    private readonly crawlResults;
    private readonly maxDepth;
    private readonly maxPages;
    constructor(configService: ConfigService, httpService: HttpService, crawlerEngine: CrawlerEngineService, serviceDiscovery: ServiceDiscoveryService);
    startCrawl(dto: StartCrawlDto): Promise<CrawlResult>;
    private performCrawl;
    private sendWebhook;
    getCrawlStatus(crawlId: string): CrawlResult | null;
    getCrawlsForTenant(tenantId: string): CrawlResult[];
}
//# sourceMappingURL=crawler.service.d.ts.map