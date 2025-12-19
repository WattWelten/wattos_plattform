import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { KPICalculationService } from './kpi-calculation.service';
import { TrendAnalysisService } from './trend-analysis.service';
import { CacheService } from '@wattweiser/shared';

/**
 * Analytics Service
 * 
 * Berechnet Analytics-Daten für Dashboards
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly prisma: PrismaClient;
  private readonly cacheTTL = 300; // 5 Minuten

  constructor(
    private readonly kpiCalculation: KPICalculationService,
    private readonly trendAnalysis: TrendAnalysisService,
    private readonly cache: CacheService,
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Analytics-Daten abrufen
   */
  async getAnalytics(
    tenantId: string,
    options?: {
      timeRange?: string;
      metrics?: string[];
    },
  ): Promise<any> {
    const cacheKey = `analytics:${tenantId}:${JSON.stringify(options)}`;
    
    // Cache-Check
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Analytics loaded from cache: ${cacheKey}`);
      return cached;
    }

    const timeRange = options?.timeRange || '7d';
    const startDate = this.getTimeRangeStart(timeRange);

    // Parallel alle Analytics-Daten berechnen
    const [conversations, agents, kpis, trends] = await Promise.all([
      this.getConversationAnalytics(tenantId, startDate),
      this.getAgentAnalytics(tenantId, startDate),
      this.kpiCalculation.calculateKPIs(tenantId, startDate),
      this.trendAnalysis.analyzeTrends(tenantId, startDate),
    ]);

    const analytics = {
      timeRange,
      conversations,
      agents,
      kpis,
      trends,
      generatedAt: new Date(),
    };

    // Cache speichern
    await this.cache.set(cacheKey, analytics, this.cacheTTL);

    return analytics;
  }

  /**
   * Conversation Analytics
   */
  private async getConversationAnalytics(
    tenantId: string,
    startDate: Date,
  ): Promise<any> {
    const [total, active, completed, avgMessages] = await Promise.all([
      this.prisma.conversation.count({
        where: {
          tenantId,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.conversation.count({
        where: {
          tenantId,
          status: 'active',
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.conversation.count({
        where: {
          tenantId,
          status: 'completed',
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.conversation.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startDate },
        },
        _avg: {
          messageCount: true,
        },
      }),
    ]);

    return {
      total,
      active,
      completed,
      avgMessages: avgMessages._avg.messageCount || 0,
    };
  }

  /**
   * Agent Analytics
   */
  private async getAgentAnalytics(
    tenantId: string,
    startDate: Date,
  ): Promise<any> {
    const agents = await this.prisma.agent.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      total: agents.length,
      active: agents.filter((a) => a.status === 'active').length,
      inactive: agents.filter((a) => a.status === 'inactive').length,
      agents,
    };
  }

  /**
   * Time-Range Start berechnen
   */
  private getTimeRangeStart(timeRange: string): Date {
    const now = new Date();
    const ranges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    };

    const ms = ranges[timeRange] || ranges['7d'];
    return new Date(now.getTime() - ms);
  }
}


