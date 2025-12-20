"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const llm_controller_1 = require("./llm.controller");
const llm_service_1 = require("./llm.service");
const provider_factory_1 = require("./services/provider-factory");
const cost_tracking_service_1 = require("./services/cost-tracking.service");
const provider_health_service_1 = require("./services/provider-health.service");
const shared_1 = require("@wattweiser/shared");
let LlmModule = class LlmModule {
};
exports.LlmModule = LlmModule;
exports.LlmModule = LlmModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule, shared_1.ResilienceModule, shared_1.ObservabilityModule],
        controllers: [llm_controller_1.LlmController],
        providers: [llm_service_1.LlmService, provider_factory_1.ProviderFactory, cost_tracking_service_1.CostTrackingService, provider_health_service_1.ProviderHealthService],
    })
], LlmModule);
//# sourceMappingURL=llm.module.js.map