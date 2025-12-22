export declare class MetricsService {
    private readonly logger;
    private prisma;
    constructor();
    getDashboardMetrics(tenantId: string): Promise<{
        users: number;
        chats: number;
        agentRuns: number;
        llmUsage: {
            totalCost: number;
            totalTokens: number;
            usageByProvider: Record<string, {
                cost: number;
                tokens: number;
            }>;
        };
    }>;
    getLLMUsageMetrics(tenantId: string, startDate?: Date, endDate?: Date): Promise<{
        totalCost: number;
        totalTokens: number;
        totalRequests: number;
        byProvider: Record<string, {
            cost: number;
            tokens: number;
            count: number;
        }>;
        byModel: Record<string, {
            cost: number;
            tokens: number;
            count: number;
        }>;
    }>;
    getAgentPerformanceMetrics(tenantId: string, agentId?: string): Promise<{
        total: number;
        completed: number;
        failed: number;
        successRate: number;
        avgDuration: number;
        byAgent: Record<string, {
            total: number;
            completed: number;
            failed: number;
            avgDuration: number;
        }>;
    }>;
}
//# sourceMappingURL=metrics.service.d.ts.map