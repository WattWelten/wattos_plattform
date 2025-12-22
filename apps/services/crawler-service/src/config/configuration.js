"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT || process.env.CRAWLER_SERVICE_PORT || '3015', 10),
    env: process.env.NODE_ENV || 'development',
    services: {
        customerIntelligence: process.env.CUSTOMER_INTELLIGENCE_SERVICE_URL || 'http://localhost:3014',
        ingestion: process.env.INGESTION_SERVICE_URL || 'http://localhost:8001',
    },
    crawler: {
        maxDepth: parseInt(process.env.CRAWLER_MAX_DEPTH || '3', 10),
        maxPages: parseInt(process.env.CRAWLER_MAX_PAGES || '100', 10),
        timeout: parseInt(process.env.CRAWLER_TIMEOUT || '30000', 10),
        userAgent: process.env.CRAWLER_USER_AGENT || 'WattOS-KI-Crawler/1.0',
        usePuppeteer: process.env.CRAWLER_USE_PUPPETEER === 'true',
    },
});
//# sourceMappingURL=configuration.js.map