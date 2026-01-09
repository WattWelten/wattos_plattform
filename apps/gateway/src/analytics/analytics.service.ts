import { Injectable } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';

export interface AnalyticsStats {
  totalCalls: number;
  totalCost: number;
  avgLatency: number;
  errorRate: number;
  activeUsers: number;
}

export interface UsageDataPoint {
  date: string;
  calls: number;
  cost: number;
  latency: number;
  errors: number;
}

export interface ProviderData {
  provider: string;
  calls: number;
  cost: number;
}

export interface CostDistribution {
  provider: string;
  amount: number;
  percentage: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get analytics stats for a time range
   */
  async getStats(timeRange: string, tenantId?: string): Promise<AnalyticsStats> {
    const { startDate, endDate } = this.getDateRange(timeRange);

    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(tenantId && { tenantId }),
    };

    // Get LLM usage data
    const llmUsage = await (this.prisma.client as any).llMUsage.findMany({
      where,
      select: {
        tokensUsed: true,
        cost: true,
        latencyMs: true,
        error: true,
        tenantId: true,
      },
    });

    const totalCalls = llmUsage.length;
    const totalCost = llmUsage.reduce((sum: number, usage: any) => sum + (usage.cost || 0), 0);
    const avgLatency =
      llmUsage.length > 0
        ? llmUsage.reduce((sum: number, usage: any) => sum + (usage.latencyMs || 0), 0) / llmUsage.length
        : 0;
    const errorCount = llmUsage.filter((usage: any) => usage.error).length;
    const errorRate = totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0;

    // Get active users
    const userWhere: any = {};
    if (tenantId) {
      userWhere.tenantId = tenantId;
    }
    userWhere.chats = {
      some: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    };
    const activeUsers = await this.prisma.client.user.count({
      where: userWhere,
    });

    return {
      totalCalls,
      totalCost,
      avgLatency: Math.round(avgLatency),
      errorRate: Math.round(errorRate * 100) / 100,
      activeUsers,
    };
  }

  /**
   * Get usage data over time
   */
  async getUsageData(timeRange: string, tenantId?: string): Promise<UsageDataPoint[]> {
    const { startDate, endDate, interval } = this.getDateRangeWithInterval(timeRange);

    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(tenantId && { tenantId }),
    };

    const llmUsage = await (this.prisma.client as any).llMUsage.findMany({
      where,
      select: {
        createdAt: true,
        tokensUsed: true,
        cost: true,
        latencyMs: true,
        error: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by time interval
    const grouped = new Map<string, UsageDataPoint>();

    llmUsage.forEach((usage: any) => {
      const dateKey = this.getDateKey(usage.createdAt, interval);
      const existing = grouped.get(dateKey) || {
        date: dateKey,
        calls: 0,
        cost: 0,
        latency: 0,
        errors: 0,
      };

      existing.calls += 1;
      existing.cost += usage.cost || 0;
      existing.latency += usage.latencyMs || 0;
      if (usage.error) {
        existing.errors += 1;
      }

      grouped.set(dateKey, existing);
    });

    // Calculate averages and format
    return Array.from(grouped.values()).map((point) => ({
      ...point,
      latency: point.calls > 0 ? Math.round(point.latency / point.calls) : 0,
    }));
  }

  /**
   * Get provider distribution
   */
  async getProviderData(timeRange: string, tenantId?: string): Promise<ProviderData[]> {
    const { startDate, endDate } = this.getDateRange(timeRange);

    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(tenantId && { tenantId }),
    };

    const llmUsage = await (this.prisma.client as any).llMUsage.findMany({
      where,
      select: {
        provider: true,
        tokensUsed: true,
        cost: true,
      },
    });

    const grouped = new Map<string, ProviderData>();

    llmUsage.forEach((usage: any) => {
      const provider = usage.provider || 'unknown';
      const existing = grouped.get(provider) || {
        provider,
        calls: 0,
        cost: 0,
      };

      existing.calls += 1;
      existing.cost += usage.cost || 0;

      grouped.set(provider, existing);
    });

    return Array.from(grouped.values());
  }

  /**
   * Get cost distribution
   */
  async getCostDistribution(timeRange: string, tenantId?: string): Promise<CostDistribution[]> {
    const providerData = await this.getProviderData(timeRange, tenantId);
    const totalCost = providerData.reduce((sum, p) => sum + p.cost, 0);

    return providerData.map((p) => ({
      provider: p.provider,
      amount: p.cost,
      percentage: totalCost > 0 ? (p.cost / totalCost) * 100 : 0,
    }));
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(timeRange: string, tenantId?: string) {
    const { startDate, endDate } = this.getDateRange(timeRange);

    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(tenantId && {
        user: {
          tenantId,
        },
      }),
    };

    const feedback = await (this.prisma.client as any).feedback.findMany({
      where,
      select: {
        rating: true,
        reason: true,
      },
    });

    const total = feedback.length;
    const positive = feedback.filter((f: any) => f.rating && f.rating >= 4).length;
    const negative = feedback.filter((f: any) => f.rating && f.rating <= 2).length;
    const reasons = feedback
      .filter((f: any) => f.metadata && typeof f.metadata === 'object' && 'reason' in f.metadata)
      .reduce((acc: any, f: any) => {
        const reason = (f.metadata as any).reason || 'unknown';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      total,
      positive,
      negative,
      satisfactionRate: total > 0 ? (positive / total) * 100 : 0,
      reasons,
    };
  }

  private getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case '24h':
        startDate.setHours(endDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    return { startDate, endDate };
  }

  private getDateRangeWithInterval(
    timeRange: string
  ): { startDate: Date; endDate: Date; interval: 'hour' | 'day' | 'week' } {
    const { startDate, endDate } = this.getDateRange(timeRange);
    let interval: 'hour' | 'day' | 'week' = 'day';

    switch (timeRange) {
      case '24h':
        interval = 'hour';
        break;
      case '7d':
      case '30d':
        interval = 'day';
        break;
      case '90d':
        interval = 'week';
        break;
    }

    return { startDate, endDate, interval };
  }

  private getDateKey(date: Date, interval: 'hour' | 'day' | 'week'): string {
    const d = new Date(date);

    switch (interval) {
      case 'hour':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
      case 'day':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      default:
        return d.toISOString().split('T')[0] || '';
    }
  }
}
