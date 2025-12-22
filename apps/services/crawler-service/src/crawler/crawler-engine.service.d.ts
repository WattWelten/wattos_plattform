import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CrawledPage } from './interfaces/crawled-page.interface';
export declare class CrawlerEngineService {
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    private readonly userAgent;
    private readonly timeout;
    constructor(configService: ConfigService, httpService: HttpService);
    crawlPage(url: string, depth?: number): Promise<CrawledPage | null>;
    normalizeUrl(url: string, baseUrl: string): string | null;
    isUrlAllowed(url: string, allowedDomains: string[], excludePaths?: string[]): boolean;
}
//# sourceMappingURL=crawler-engine.service.d.ts.map