import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ServiceDiscoveryService } from '@wattweiser/shared';
export declare class DataAggregationService {
    private readonly configService;
    private readonly httpService;
    private readonly serviceDiscovery;
    private readonly logger;
    constructor(configService: ConfigService, httpService: HttpService, serviceDiscovery: ServiceDiscoveryService);
    aggregateCrawlerData(tenantId: string): Promise<any[]>;
    aggregateDocumentData(tenantId: string): Promise<any[]>;
    aggregateConversationData(tenantId: string): Promise<any[]>;
    aggregateAllData(tenantId: string, dataSources?: string[]): Promise<{
        crawler: any[];
        documents: any[];
        conversations: any[];
    }>;
}
//# sourceMappingURL=data-aggregation.service.d.ts.map