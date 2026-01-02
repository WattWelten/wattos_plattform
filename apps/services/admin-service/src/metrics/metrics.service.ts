import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';

/**
 * Metrics Service
 * Berechnet und aggregiert Plattform-Metriken
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Dashboard-Metriken
   */
  async getDashboardMetrics(tenantId: string) {
    const [users, chats, agentRuns, llmUsage] = await Promise.all([
      this.prismaService.client.user.count({ where: { tenantId } }),
      this.prismaService.client.chat.count({ where: { tenantId } }),
      this.prismaService.client.agentRun.count({
        where: {
          agent: { tenantId },
        },
      }),
      this.prismaService.client.lLMUsage.findMany({
        where: { tenantId },
        select: {
          costUsd: true,
          totalTokens: true,
          provider: true,
        },
      }),
    ]);

    const totalCost = llmUsage.reduce((sum: number, usage: any) => sum + Number(usage.costUsd), 0);
    const totalTokens = llmUsage.reduce((sum: number, usage: any) => sum + usage.totalTokens, 0);

    const usageByProvider = llmUsage.reduce((acc: Record<string, { cost: number; tokens: number }>, usage: any) => {
      const provider = usage.provider;
      if (!acc[provider]) {
        acc[provider] = { cost: 0, tokens: 0 };
      }
      acc[provider].cost += Number(usage.costUsd);
      acc[provider].tokens += usage.totalTokens;
      return acc;
    }, {} as Record<string, { cost: number; tokens: number }>);

    return {
      users,
      chats,
      agentRuns,
      llmUsage: {
        totalCost,
        totalTokens,
        usageByProvider,
      },
    };
  }

  /**
   * LLM-Usage-Metriken
   */
  async getLLMUsageMetrics(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const usage = await this.prismaService.client.lLMUsage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const totalCost = usage.reduce((sum: number, u: any) => sum + Number(u.costUsd), 0);
    const totalTokens = usage.reduce((sum: number, u: any) => sum + u.totalTokens, 0);

    const byProvider = usage.reduce((acc: Record<string, { cost: number; tokens: number; count: number }>, u: any) => {
      const provider = u.provider;
      if (!acc[provider]) {
        acc[provider] = { cost: 0, tokens: 0, count: 0 };
      }
      const entry = acc[provider];
      if (entry) {
        entry.cost += Number(u.costUsd);
        entry.tokens += u.totalTokens;
        entry.count += 1;
      }
      return acc;
    }, {} as Record<string, { cost: number; tokens: number; count: number }>);

    const byModel = usage.reduce((acc: Record<string, { cost: number; tokens: number; count: number }>, u: any) => {
      const model = u.model;
      if (!acc[model]) {
        acc[model] = { cost: 0, tokens: 0, count: 0 };
      }
      const entry = acc[model];
      if (entry) {
        entry.cost += Number(u.costUsd);
        entry.tokens += u.totalTokens;
        entry.count += 1;
      }
      return acc;
    }, {} as Record<string, { cost: number; tokens: number; count: number }>);

    return {
      totalCost,
      totalTokens,
      totalRequests: usage.length,
      byProvider,
      byModel,
    };
  }

  /**
   * Agent-Performance-Metriken
   */
  async getAgentPerformanceMetrics(tenantId: string, agentId?: string) {
    const where: any = {
      agent: { tenantId },
    };

    if (agentId) {
      where.agentId = agentId;
    }

    const runs = await this.prismaService.client.agentRun.findMany({
      where,
      include: {
        agent: true,
      },
    });

    const completed = runs.filter((r: any) => r.status === 'completed');
    const failed = runs.filter((r: any) => r.status === 'failed');

    const avgDuration = completed.length > 0
      ? completed.reduce((sum: number, r: any) => {
          const metrics = r.metrics as any;
          return sum + (metrics.duration || 0);
        }, 0) / completed.length
      : 0;

    const byAgent = runs.reduce((acc: Record<string, { total: number; completed: number; failed: number; avgDuration: number }>, r: any) => {
      if (!acc[r.agentId]) {
        acc[r.agentId] = {
          total: 0,
          completed: 0,
          failed: 0,
          avgDuration: 0,
        };
      }
      const agentEntry = acc[r.agentId];
      if (agentEntry) {
        agentEntry.total += 1;
        if (r.status === 'completed') {
          agentEntry.completed += 1;
          const metrics = r.metrics as any;
          agentEntry.avgDuration += metrics.duration || 0;
        }
        if (r.status === 'failed') {
          agentEntry.failed += 1;
        }
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number; failed: number; avgDuration: number }>);

    // Durchschnitt berechnen
    Object.keys(byAgent).forEach((id) => {
      if (byAgent[id].completed > 0) {
        byAgent[id].avgDuration = byAgent[id].avgDuration / byAgent[id].completed;
      }
    });

    return {
      total: runs.length,
      completed: completed.length,
      failed: failed.length,
      successRate: runs.length > 0 ? completed.length / runs.length : 0,
      avgDuration,
      byAgent,
    };
  }
}


