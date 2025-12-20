import { ProviderFactory } from './provider-factory';
export declare class ProviderHealthService {
    private readonly providerFactory;
    constructor(providerFactory: ProviderFactory);
    collectStatuses(providers: string[]): Promise<{
        name: string;
        healthy: boolean;
    }[]>;
}
//# sourceMappingURL=provider-health.service.d.ts.map