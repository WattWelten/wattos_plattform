"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const axios_1 = require("@nestjs/axios");
const analysis_module_1 = require("./analysis/analysis.module");
const personas_module_1 = require("./personas/personas.module");
const agent_generation_module_1 = require("./agent-generation/agent-generation.module");
const content_enrichment_module_1 = require("./content-enrichment/content-enrichment.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const health_module_1 = require("./health/health.module");
const shared_1 = require("@wattweiser/shared");
const configuration_1 = __importDefault(require("./config/configuration"));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            axios_1.HttpModule,
            shared_1.ServiceDiscoveryModule,
            analysis_module_1.AnalysisModule,
            personas_module_1.PersonasModule,
            agent_generation_module_1.AgentGenerationModule,
            content_enrichment_module_1.ContentEnrichmentModule,
            webhooks_module_1.WebhooksModule,
            health_module_1.HealthModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map