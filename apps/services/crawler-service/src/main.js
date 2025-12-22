"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const app_module_1 = require("./app.module");
const helmet_1 = __importDefault(require("helmet"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    const corsOrigins = process.env.CORS_ORIGIN?.split(',') || process.env.CORS_ORIGINS?.split(',') || (process.env.NODE_ENV === 'production' ? [] : ['*']);
    app.enableCors({
        origin: corsOrigins.length > 0 ? corsOrigins : false,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalGuards(new throttler_1.ThrottlerGuard());
    app.useGlobalFilters(new HttpExceptionFilter());
    const port = process.env.PORT || process.env.CRAWLER_SERVICE_PORT || 3015;
    await app.listen(port);
    console.log(`🕷️ Crawler Service running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map