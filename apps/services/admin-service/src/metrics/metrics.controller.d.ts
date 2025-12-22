import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
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
    getLLMUsageMetrics(tenantId: string, startDate?: string, endDate?: string): Promise<{
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
//# sourceMappingURL=metrics.controller.d.ts.map