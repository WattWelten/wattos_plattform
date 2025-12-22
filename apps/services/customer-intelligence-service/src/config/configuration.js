"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT || process.env.CUSTOMER_INTELLIGENCE_PORT || '3014', 10),
    env: process.env.NODE_ENV || 'development',
    database: {
        url: process.env.DATABASE_URL,
    },
    services: {
        llmGateway: process.env.LLM_GATEWAY_URL || 'http://localhost:3009',
        agentService: process.env.AGENT_SERVICE_URL || 'http://localhost:3008',
        ragService: process.env.RAG_SERVICE_URL || 'http://localhost:3007',
        chatService: process.env.CHAT_SERVICE_URL || 'http://localhost:3006',
        adminService: process.env.ADMIN_SERVICE_URL || 'http://localhost:3008',
        crawlerService: process.env.CRAWLER_SERVICE_URL || 'http://localhost:3015',
    },
});
//# sourceMappingURL=configuration.js.map