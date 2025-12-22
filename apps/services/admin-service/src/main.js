"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const shared_1 = require("@wattweiser/shared");
const helmet_1 = __importDefault(require("helmet"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: false,
    });
    const configService = app.get(config_1.ConfigService);
    const logger = app.get(shared_1.StructuredLoggerService);
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: configService.get('CORS_ORIGIN')?.split(',') || '*',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalGuards(new throttler_1.ThrottlerGuard());
    const port = configService.get('PORT', 3007);
    await app.listen(port);
    logger.info('Admin Service started', {
        port,
        environment: configService.get('NODE_ENV', 'development'),
    });
}
bootstrap();
//# sourceMappingURL=main.js.map