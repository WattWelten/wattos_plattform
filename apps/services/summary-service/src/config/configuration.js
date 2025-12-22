"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT || '3009', 10),
    env: process.env.NODE_ENV || 'development',
    llmGateway: {
        url: process.env.LLM_GATEWAY_URL || 'http://localhost:3002',
    },
});
//# sourceMappingURL=configuration.js.map