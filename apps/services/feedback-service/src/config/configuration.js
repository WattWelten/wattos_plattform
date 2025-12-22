"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT || '3010', 10),
    env: process.env.NODE_ENV || 'development',
    database: {
        url: process.env.DATABASE_URL,
    },
});
//# sourceMappingURL=configuration.js.map