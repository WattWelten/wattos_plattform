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
var RetrievalAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetrievalAdapter = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const shared_1 = require("@wattweiser/shared");
let RetrievalAdapter = RetrievalAdapter_1 = class RetrievalAdapter {
    httpService;
    configService;
    serviceDiscovery;
    logger = new common_1.Logger(RetrievalAdapter_1.name);
    constructor(httpService, configService, serviceDiscovery) {
        this.httpService = httpService;
        this.configService = configService;
        this.serviceDiscovery = serviceDiscovery;
    }
    async execute(request) {
        const startTime = Date.now();
        try {
            const { knowledgeSpaceId, query, topK = 5 } = request.input;
            if (!knowledgeSpaceId || !query) {
                throw new Error('Knowledge space ID and query are required');
            }
            const ragServiceUrl = this.serviceDiscovery.getServiceUrl('rag-service', 3007);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${ragServiceUrl}/search`, {
                knowledgeSpaceId,
                query,
                topK,
            }));
            const executionTime = Date.now() - startTime;
            return {
                success: true,
                output: {
                    results: response.data.results || [],
                    query,
                    knowledgeSpaceId,
                },
                executionTime,
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            this.logger.error(`Retrieval search failed: ${error.message}`);
            return {
                success: false,
                error: error.message || 'Retrieval search failed',
                executionTime,
            };
        }
    }
    async validateInput(input) {
        if (!input.knowledgeSpaceId || !input.query) {
            return false;
        }
        if (typeof input.query !== 'string' || input.query.trim().length === 0) {
            return false;
        }
        if (input.topK && (typeof input.topK !== 'number' || input.topK < 1 || input.topK > 100)) {
            return false;
        }
        return true;
    }
    async healthCheck() {
        try {
            const ragServiceUrl = this.serviceDiscovery.getServiceUrl('rag-service', 3007);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${ragServiceUrl}/health`).pipe());
            return response.status === 200;
        }
        catch {
            return false;
        }
    }
};
exports.RetrievalAdapter = RetrievalAdapter;
exports.RetrievalAdapter = RetrievalAdapter = RetrievalAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        shared_1.ServiceDiscoveryService])
], RetrievalAdapter);
//# sourceMappingURL=retrieval.adapter.js.map