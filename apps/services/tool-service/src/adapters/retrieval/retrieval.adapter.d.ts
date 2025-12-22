import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IToolAdapter } from '../interfaces/adapter.interface';
import { ToolExecutionRequest, ToolExecutionResult } from '../../registry/interfaces/tool.interface';
import { ServiceDiscoveryService } from '@wattweiser/shared';
export declare class RetrievalAdapter implements IToolAdapter {
    private readonly httpService;
    private readonly configService;
    private readonly serviceDiscovery;
    private readonly logger;
    constructor(httpService: HttpService, configService: ConfigService, serviceDiscovery: ServiceDiscoveryService);
    execute(request: ToolExecutionRequest): Promise<ToolExecutionResult>;
    validateInput(input: Record<string, any>): Promise<boolean>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=retrieval.adapter.d.ts.map