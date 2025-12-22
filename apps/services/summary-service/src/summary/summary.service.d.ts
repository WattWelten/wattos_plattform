import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { ServiceDiscoveryService } from '@wattweiser/shared';
export declare class SummaryService {
    private readonly configService;
    private readonly httpService;
    private readonly serviceDiscovery;
    private readonly logger;
    constructor(configService: ConfigService, httpService: HttpService, serviceDiscovery: ServiceDiscoveryService);
    createSummary(dto: CreateSummaryDto): Promise<{
        summary: any;
        originalLength: number;
        summaryLength: any;
        compressionRatio: number;
        model: string;
        provider: string;
    }>;
    summarizeChat(chatId: string, maxLength?: number): Promise<{
        summary: any;
        originalLength: number;
        summaryLength: any;
        compressionRatio: number;
        model: string;
        provider: string;
    }>;
    summarizeDocument(documentId: string, maxLength?: number): Promise<{
        summary: any;
        originalLength: number;
        summaryLength: any;
        compressionRatio: number;
        model: string;
        provider: string;
    }>;
}
//# sourceMappingURL=summary.service.d.ts.map