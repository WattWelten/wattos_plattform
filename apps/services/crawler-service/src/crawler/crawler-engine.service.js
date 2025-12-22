"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CrawlerEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerEngineService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const cheerio = __importStar(require("cheerio"));
const rxjs_1 = require("rxjs");
let CrawlerEngineService = CrawlerEngineService_1 = class CrawlerEngineService {
    configService;
    httpService;
    logger = new common_1.Logger(CrawlerEngineService_1.name);
    userAgent;
    timeout;
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
        this.userAgent = this.configService.get('crawler.userAgent', 'WattOS-KI-Crawler/1.0');
        this.timeout = this.configService.get('crawler.timeout', 30000);
    }
    async crawlPage(url, depth = 0) {
        try {
            this.logger.debug(`Crawling page: ${url} (depth: ${depth})`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
                timeout: this.timeout,
                maxRedirects: 5,
            }));
            const html = response.data;
            const $ = cheerio.load(html);
            const title = $('title').text().trim() || '';
            const description = $('meta[name="description"]').attr('content') || '';
            const keywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || [];
            const language = $('html').attr('lang') || $('meta[http-equiv="content-language"]').attr('content') || 'de';
            $('script, style, nav, footer, header, aside').remove();
            const content = $('body').text().replace(/\s+/g, ' ').trim();
            const links = [];
            $('a[href]').each((_, element) => {
                const href = $(element).attr('href');
                if (href) {
                    try {
                        const absoluteUrl = new URL(href, url).href;
                        links.push(absoluteUrl);
                    }
                    catch {
                    }
                }
            });
            const images = [];
            $('img[src]').each((_, element) => {
                const src = $(element).attr('src');
                if (src) {
                    try {
                        const absoluteUrl = new URL(src, url).href;
                        images.push(absoluteUrl);
                    }
                    catch {
                    }
                }
            });
            const metadata = {
                description,
                keywords,
                language,
                author: $('meta[name="author"]').attr('content'),
                publishedDate: $('meta[property="article:published_time"]').attr('content') ||
                    $('time[datetime]').first().attr('datetime'),
                modifiedDate: $('meta[property="article:modified_time"]').attr('content'),
            };
            return {
                url,
                title,
                content,
                html,
                metadata,
                links,
                images,
                depth,
                crawledAt: new Date(),
            };
        }
        catch (error) {
            this.logger.warn(`Failed to crawl page ${url}: ${error.message}`);
            return null;
        }
    }
    normalizeUrl(url, baseUrl) {
        try {
            const urlObj = new URL(url, baseUrl);
            urlObj.hash = '';
            return urlObj.href;
        }
        catch {
            return null;
        }
    }
    isUrlAllowed(url, allowedDomains, excludePaths = []) {
        try {
            const urlObj = new URL(url);
            if (allowedDomains.length > 0) {
                const isAllowed = allowedDomains.some(domain => {
                    const domainPattern = domain.replace(/\./g, '\\.').replace(/\*/g, '.*');
                    const regex = new RegExp(`^https?://.*${domainPattern}`, 'i');
                    return regex.test(url);
                });
                if (!isAllowed) {
                    return false;
                }
            }
            if (excludePaths.length > 0) {
                const pathname = urlObj.pathname;
                if (excludePaths.some(exclude => pathname.includes(exclude))) {
                    return false;
                }
            }
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        }
        catch {
            return false;
        }
    }
};
exports.CrawlerEngineService = CrawlerEngineService;
exports.CrawlerEngineService = CrawlerEngineService = CrawlerEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], CrawlerEngineService);
//# sourceMappingURL=crawler-engine.service.js.map