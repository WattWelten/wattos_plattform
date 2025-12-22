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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerController = void 0;
const common_1 = require("@nestjs/common");
const crawler_service_1 = require("./crawler.service");
const start_crawl_dto_1 = require("./dto/start-crawl.dto");
let CrawlerController = class CrawlerController {
    crawlerService;
    constructor(crawlerService) {
        this.crawlerService = crawlerService;
    }
    async startCrawl(req, dto) {
        const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || dto.tenantId;
        if (!tenantId) {
            throw new Error('Tenant ID is required');
        }
        return this.crawlerService.startCrawl({
            ...dto,
            tenantId,
        });
    }
    async getCrawlStatus(crawlId) {
        const status = this.crawlerService.getCrawlStatus(crawlId);
        if (!status) {
            throw new Error(`Crawl ${crawlId} not found`);
        }
        return status;
    }
    async getCrawlerData(req, tenantId) {
        const effectiveTenantId = req.user?.tenantId || req.headers['x-tenant-id'] || tenantId;
        if (!effectiveTenantId) {
            throw new Error('Tenant ID is required');
        }
        const crawls = this.crawlerService.getCrawlsForTenant(effectiveTenantId);
        const allPages = crawls.flatMap(crawl => crawl.pages);
        return {
            pages: allPages,
            totalPages: allPages.length,
            crawls: crawls.length,
        };
    }
};
exports.CrawlerController = CrawlerController;
__decorate([
    (0, common_1.Post)('start'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, start_crawl_dto_1.StartCrawlDto]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "startCrawl", null);
__decorate([
    (0, common_1.Get)('status/:crawlId'),
    __param(0, (0, common_1.Param)('crawlId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "getCrawlStatus", null);
__decorate([
    (0, common_1.Get)('data'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "getCrawlerData", null);
exports.CrawlerController = CrawlerController = __decorate([
    (0, common_1.Controller)('api/v1/crawler'),
    __metadata("design:paramtypes", [crawler_service_1.CrawlerService])
], CrawlerController);
//# sourceMappingURL=crawler.controller.js.map