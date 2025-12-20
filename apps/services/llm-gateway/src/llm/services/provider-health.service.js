"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderHealthService = void 0;
const common_1 = require("@nestjs/common");
const provider_factory_1 = require("./provider-factory");
let ProviderHealthService = class ProviderHealthService {
    providerFactory;
    constructor(providerFactory) {
        this.providerFactory = providerFactory;
    }
    async collectStatuses(providers) {
        const results = await Promise.all(providers.map(async (name) => {
            try {
                const provider = this.providerFactory.getProvider(name);
                const healthy = await provider.healthCheck();
                return { name, healthy };
            }
            catch {
                return { name, healthy: false };
            }
        }));
        return results;
    }
};
exports.ProviderHealthService = ProviderHealthService;
exports.ProviderHealthService = ProviderHealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [provider_factory_1.ProviderFactory])
], ProviderHealthService);
//# sourceMappingURL=provider-health.service.js.map