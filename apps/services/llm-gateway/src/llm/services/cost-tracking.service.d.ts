interface RecordUsageInput {
    tenantId?: string;
    provider: string;
    model: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export declare class CostTrackingService {
    private readonly logger;
    private prisma;
    constructor();
    calculateCost(provider: string, model: string, usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    }): number;
    recordUsage(input: RecordUsageInput): Promise<{
        costUsd: number;
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    }>;
    getCostsForTenant(tenantId: string, startDate?: Date, endDate?: Date): Promise<{
        totalCost: any;
        totalTokens: any;
        usageCount: any;
        usage: any;
    }>;
}
export {};
//# sourceMappingURL=cost-tracking.service.d.ts.map