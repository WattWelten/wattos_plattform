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
const rbac_module_1 = require("./rbac/rbac.module");
const audit_module_1 = require("./audit/audit.module");
const metrics_module_1 = require("./metrics/metrics.module");
const db_module_1 = require("./db/db.module");
const knowledge_spaces_module_1 = require("./knowledge-spaces/knowledge-spaces.module");
const feature_flags_module_1 = require("./feature-flags/feature-flags.module");
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
            shared_1.ObservabilityModule,
            shared_1.ServiceDiscoveryModule,
            rbac_module_1.RbacModule,
            audit_module_1.AuditModule,
            metrics_module_1.MetricsModule,
            db_module_1.DbModule,
            knowledge_spaces_module_1.KnowledgeSpacesModule,
            feature_flags_module_1.FeatureFlagsModule,
        ],
        controllers: [shared_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map