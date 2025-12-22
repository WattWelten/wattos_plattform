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
var DataAggregationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataAggregationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const shared_1 = require("@wattweiser/shared");
let DataAggregationService = DataAggregationService_1 = class DataAggregationService {
    configService;
    httpService;
    serviceDiscovery;
    logger = new common_1.Logger(DataAggregationService_1.name);
    constructor(configService, httpService, serviceDiscovery) {
        this.configService = configService;
        this.httpService = httpService;
        this.serviceDiscovery = serviceDiscovery;
    }
    async aggregateCrawlerData(tenantId) {
        try {
            const crawlerServiceUrl = this.serviceDiscovery.getServiceUrl('crawler-service', 3015);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${crawlerServiceUrl}/api/v1/crawler/data`, {
                headers: { 'X-Tenant-Id': tenantId },
            }));
            return response.data || [];
        }
        catch (error) {
            this.logger.warn(`Failed to aggregate crawler data: ${error.message}`);
            return [];
        }
    }
    async aggregateDocumentData(tenantId) {
        try {
            const adminServiceUrl = this.serviceDiscovery.getServiceUrl('admin-service', 3008);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${adminServiceUrl}/db/documents`, {
                headers: { 'X-Tenant-Id': tenantId },
            }));
            return response.data || [];
        }
        catch (error) {
            this.logger.warn(`Failed to aggregate document data: ${error.message}`);
            return [];
        }
    }
    async aggregateConversationData(tenantId) {
        try {
            const chatServiceUrl = this.serviceDiscovery.getServiceUrl('chat-service', 3006);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${chatServiceUrl}/v1/conversations`, {
                headers: { 'X-Tenant-Id': tenantId },
                params: { tenantId },
            }));
            return response.data || [];
        }
        catch (error) {
            this.logger.warn(`Failed to aggregate conversation data: ${error.message}`);
            return [];
        }
    }
    async aggregateAllData(tenantId, dataSources = ['crawler', 'documents', 'conversations']) {
        const results = await Promise.allSettled([
            dataSources.includes('crawler') ? this.aggregateCrawlerData(tenantId) : Promise.resolve([]),
            dataSources.includes('documents') ? this.aggregateDocumentData(tenantId) : Promise.resolve([]),
            dataSources.includes('conversations') ? this.aggregateConversationData(tenantId) : Promise.resolve([]),
        ]);
        return {
            crawler: results[0].status === 'fulfilled' ? results[0].value : [],
            documents: results[1].status === 'fulfilled' ? results[1].value : [],
            conversations: results[2].status === 'fulfilled' ? results[2].value : [],
        };
    }
};
exports.DataAggregationService = DataAggregationService;
exports.DataAggregationService = DataAggregationService = DataAggregationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        shared_1.ServiceDiscoveryService])
], DataAggregationService);
//# sourceMappingURL=data-aggregation.service.js.map