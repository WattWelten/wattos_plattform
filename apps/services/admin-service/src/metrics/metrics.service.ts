import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';

/**
 * Metrics Service
 * Berechnet und aggregiert Plattform-Metriken
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Dashboard-Metriken
   */
  async getDashboardMetrics(tenantId: string) {
    const [users, chats, agentRuns, llmUsage] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.chat.count({ where: { tenantId } }),
      this.prisma.agentRun.count({
        where: {
          agent: { tenantId },
        },
      }),
      this.prisma.lLMUsage.findMany({
        where: { tenantId },
        select: {
          costUsd: true,
          totalTokens: true,
          provider: true,
        },
      }),
    ]);

    const totalCost = llmUsage.reduce((sum, usage) => sum + Number(usage.costUsd), 0);
    const totalTokens = llmUsage.reduce((sum, usage) => sum + usage.totalTokens, 0);

    const usageByProvider = llmUsage.reduce((acc, usage) => {
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

    const usage = await this.prisma.lLMUsage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const totalCost = usage.reduce((sum, u) => sum + Number(u.costUsd), 0);
    const totalTokens = usage.reduce((sum, u) => sum + u.totalTokens, 0);

    const byProvider = usage.reduce((acc, u) => {
      if (!acc[u.provider]) {
        acc[u.provider] = { cost: 0, tokens: 0, count: 0 };
      }
      acc[u.provider].cost += Number(u.costUsd);
      acc[u.provider].tokens += u.totalTokens;
      acc[u.provider].count += 1;
      return acc;
    }, {} as Record<string, { cost: number; tokens: number; count: number }>);

    const byModel = usage.reduce((acc, u) => {
      if (!acc[u.model]) {
        acc[u.model] = { cost: 0, tokens: 0, count: 0 };
      }
      acc[u.model].cost += Number(u.costUsd);
      acc[u.model].tokens += u.totalTokens;
      acc[u.model].count += 1;
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

    const runs = await this.prisma.agentRun.findMany({
      where,
      include: {
        agent: true,
      },
    });

    const completed = runs.filter((r) => r.status === 'completed');
    const failed = runs.filter((r) => r.status === 'failed');

    const avgDuration = completed.length > 0
      ? completed.reduce((sum, r) => {
          const metrics = r.metrics as any;
          return sum + (metrics.duration || 0);
        }, 0) / completed.length
      : 0;

    const byAgent = runs.reduce((acc, r) => {
      if (!acc[r.agentId]) {
        acc[r.agentId] = {
          total: 0,
          completed: 0,
          failed: 0,
          avgDuration: 0,
        };
      }
      acc[r.agentId].total += 1;
      if (r.status === 'completed') {
        acc[r.agentId].completed += 1;
        const metrics = r.metrics as any;
        acc[r.agentId].avgDuration += metrics.duration || 0;
      }
      if (r.status === 'failed') {
        acc[r.agentId].failed += 1;
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


