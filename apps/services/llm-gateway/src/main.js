"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const shared_1 = require("@wattweiser/shared");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: false,
        bufferLogs: true,
    });
    const configService = app.get(config_1.ConfigService);
    const logger = app.get(shared_1.StructuredLoggerService).setContext('LLMGateway');
    app.enableShutdownHooks();
    app.use((0, helmet_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const port = configService.get('port') || process.env.PORT || 3015;
    await app.listen(port);
    logger.log(`🚀 LLM Gateway listening on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map