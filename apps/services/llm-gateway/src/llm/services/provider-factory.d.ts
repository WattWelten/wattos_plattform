import { ConfigService } from '@nestjs/config';
import { LlmProvider } from '../interfaces/llm-provider.interface';
export declare class ProviderFactory {
    private readonly configService;
    private readonly logger;
    private cache;
    constructor(configService: ConfigService);
    getProvider(providerName: string): LlmProvider;
    private createProvider;
}
//# sourceMappingURL=provider-factory.d.ts.map