import { Request } from 'express';
import { CrawlerService } from './crawler.service';
import { StartCrawlDto } from './dto/start-crawl.dto';
export declare class CrawlerController {
    private readonly crawlerService;
    constructor(crawlerService: CrawlerService);
    startCrawl(req: Request, dto: StartCrawlDto): Promise<import("./interfaces/crawled-page.interface").CrawlResult>;
    getCrawlStatus(crawlId: string): Promise<import("./interfaces/crawled-page.interface").CrawlResult>;
    getCrawlerData(req: Request, tenantId?: string): Promise<{
        pages: import("./interfaces/crawled-page.interface").CrawledPage[];
        totalPages: number;
        crawls: number;
    }>;
}
//# sourceMappingURL=crawler.controller.d.ts.map