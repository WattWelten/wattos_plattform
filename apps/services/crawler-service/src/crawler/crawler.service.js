"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CrawlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const uuid_1 = require("uuid");
const crawler_engine_service_1 = require("./crawler-engine.service");
const rxjs_1 = require("rxjs");
const shared_1 = require("@wattweiser/shared");
let CrawlerService = CrawlerService_1 = class CrawlerService {
    configService;
    httpService;
    crawlerEngine;
    serviceDiscovery;
    logger = new common_1.Logger(CrawlerService_1.name);
    crawlResults = new Map();
    maxDepth;
    maxPages;
    constructor(configService, httpService, crawlerEngine, serviceDiscovery) {
        this.configService = configService;
        this.httpService = httpService;
        this.crawlerEngine = crawlerEngine;
        this.serviceDiscovery = serviceDiscovery;
        this.maxDepth = this.configService.get('crawler.maxDepth', 3);
        this.maxPages = this.configService.get('crawler.maxPages', 100);
    }
    async startCrawl(dto) {
        const crawlId = (0, uuid_1.v4)();
        const maxDepth = dto.maxDepth ?? this.maxDepth;
        const maxPages = dto.maxPages ?? this.maxPages;
        const crawlResult = {
            id: crawlId,
            tenantId: dto.tenantId,
            startUrl: dto.url,
            status: 'running',
            pages: [],
            totalPages: 0,
            crawledPages: 0,
            failedPages: 0,
            startedAt: new Date(),
        };
        this.crawlResults.set(crawlId, crawlResult);
        this.logger.log(`Starting crawl ${crawlId} for ${dto.url}`);
        this.performCrawl(crawlId, dto, maxDepth, maxPages).catch((error) => {
            this.logger.error(`Crawl ${crawlId} failed: ${error.message}`);
            const result = this.crawlResults.get(crawlId);
            if (result) {
                result.status = 'failed';
                result.error = error.message;
                result.completedAt = new Date();
            }
        });
        return crawlResult;
    }
    async performCrawl(crawlId, dto, maxDepth, maxPages) {
        const visitedUrls = new Set();
        const queue = [{ url: dto.url, depth: 0 }];
        const result = this.crawlResults.get(crawlId);
        const baseUrl = new URL(dto.url);
        const allowedDomains = dto.allowedDomains || [baseUrl.hostname];
        while (queue.length > 0 && result.crawledPages < maxPages) {
            const { url, depth } = queue.shift();
            const normalizedUrl = this.crawlerEngine.normalizeUrl(url, dto.url);
            if (!normalizedUrl || visitedUrls.has(normalizedUrl)) {
                continue;
            }
            if (!this.crawlerEngine.isUrlAllowed(normalizedUrl, allowedDomains, dto.excludePaths)) {
                continue;
            }
            if (depth > maxDepth) {
                continue;
            }
            visitedUrls.add(normalizedUrl);
            const page = await this.crawlerEngine.crawlPage(normalizedUrl, depth);
            if (page) {
                result.pages.push(page);
                result.crawledPages++;
                if (depth < maxDepth && result.crawledPages < maxPages) {
                    for (const link of page.links) {
                        const normalizedLink = this.crawlerEngine.normalizeUrl(link, dto.url);
                        if (normalizedLink && !visitedUrls.has(normalizedLink)) {
                            queue.push({ url: normalizedLink, depth: depth + 1 });
                        }
                    }
                }
                await this.sendWebhook(dto.tenantId, page);
            }
            else {
                result.failedPages++;
            }
            result.totalPages = visitedUrls.size;
        }
        result.status = 'completed';
        result.completedAt = new Date();
        this.logger.log(`Crawl ${crawlId} completed: ${result.crawledPages} pages crawled`);
    }
    async sendWebhook(tenantId, page) {
        try {
            const customerIntelligenceUrl = this.serviceDiscovery.getServiceUrl('customer-intelligence-service', 3014);
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${customerIntelligenceUrl}/webhooks/crawler/data`, {
                tenantId,
                url: page.url,
                title: page.title,
                content: page.content,
                language: page.metadata.language,
                metadata: page.metadata,
                crawledAt: page.crawledAt,
            }));
            this.logger.debug(`Webhook sent for page: ${page.url}`);
        }
        catch (error) {
            this.logger.warn(`Failed to send webhook: ${error.message}`);
        }
    }
    getCrawlStatus(crawlId) {
        return this.crawlResults.get(crawlId) || null;
    }
    getCrawlsForTenant(tenantId) {
        return Array.from(this.crawlResults.values()).filter(crawl => crawl.tenantId === tenantId);
    }
};
exports.CrawlerService = CrawlerService;
exports.CrawlerService = CrawlerService = CrawlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        crawler_engine_service_1.CrawlerEngineService,
        shared_1.ServiceDiscoveryService])
], CrawlerService);
//# sourceMappingURL=crawler.service.js.map