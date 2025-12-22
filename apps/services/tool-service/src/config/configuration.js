"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT || '3004', 10),
    env: process.env.NODE_ENV || 'development',
    sandbox: {
        enabled: process.env.SANDBOX_ENABLED === 'true',
        timeout: parseInt(process.env.SANDBOX_TIMEOUT || '30000', 10),
    },
    adapters: {
        email: {
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587', 10),
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_PASSWORD,
        },
        jira: {
            host: process.env.JIRA_HOST,
            email: process.env.JIRA_EMAIL,
            apiToken: process.env.JIRA_API_TOKEN,
        },
        slack: {
            token: process.env.SLACK_BOT_TOKEN,
        },
    },
});
//# sourceMappingURL=configuration.js.map