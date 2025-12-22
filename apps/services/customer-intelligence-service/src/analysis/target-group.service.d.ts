import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@wattweiser/db';
import { ServiceDiscoveryService } from '@wattweiser/shared';
export declare class TargetGroupService {
    private readonly prisma;
    private readonly configService;
    private readonly httpService;
    private readonly serviceDiscovery;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, httpService: HttpService, serviceDiscovery: ServiceDiscoveryService);
    identifyTargetGroups(analysisId: string, aggregatedData: any): Promise<any[]>;
    analyzeDemographics(data: any[]): Promise<any>;
    analyzeBehaviorPatterns(data: any[]): Promise<any>;
    detectLanguages(data: any[]): Promise<string[]>;
}
//# sourceMappingURL=target-group.service.d.ts.map