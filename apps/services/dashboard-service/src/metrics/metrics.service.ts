import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { CacheService } from '@wattweiser/shared';

/**
 * Metrics Service
 * 
 * Sammelt und aggregiert System-Metrics
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly prisma: PrismaClient;
  private readonly cacheTTL = 60; // 1 Minute für Metrics

  constructor(private readonly cache: CacheService) {
    this.prisma = new PrismaClient();
  }

  /**
   * Metrics abrufen
   */
  async getMetrics(
    tenantId: string,
    options?: {
      types?: string[];
      timeRange?: string;
    },
  ): Promise<any> {
    const cacheKey = `metrics:${tenantId}:${JSON.stringify(options)}`;
    
    // Cache-Check
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Metrics loaded from cache: ${cacheKey}`);
      return cached;
    }

    const types = options?.types || ['all'];
    const timeRange = options?.timeRange || '1h';
    const startDate = this.getTimeRangeStart(timeRange);

    const metrics: Record<string, any> = {};

    if (types.includes('all') || types.includes('system')) {
      metrics.system = await this.getSystemMetrics(tenantId, startDate);
    }

    if (types.includes('all') || types.includes('performance')) {
      metrics.performance = await this.getPerformanceMetrics(tenantId, startDate);
    }

    if (types.includes('all') || types.includes('business')) {
      metrics.business = await this.getBusinessMetrics(tenantId, startDate);
    }

    const result = {
      tenantId,
      timeRange,
      metrics,
      generatedAt: new Date(),
    };

    // Cache speichern
    await this.cache.set(cacheKey, result, this.cacheTTL);

    return result;
  }

  /**
   * System Metrics
   */
  private async getSystemMetrics(
    tenantId: string,
    startDate: Date,
  ): Promise<any> {
    // MVP: Placeholder für System-Metrics
    // In Production: Integration mit Prometheus/OpenTelemetry
    return {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0,
    };
  }

  /**
   * Performance Metrics
   */
  private async getPerformanceMetrics(
    tenantId: string,
    startDate: Date,
  ): Promise<any> {
    // MVP: Placeholder für Performance-Metrics
    // In Production: Response Times, Throughput, etc.
    return {
      avgResponseTime: 0,
      throughput: 0,
      errorRate: 0,
    };
  }

  /**
   * Business Metrics
   */
  private async getBusinessMetrics(
    tenantId: string,
    startDate: Date,
  ): Promise<any> {
    const [conversations, agents, kbArticles] = await Promise.all([
      this.prisma.conversation.count({
        where: {
          tenantId,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.agent.count({
        where: {
          tenantId,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.kBArticle.count({
        where: {
          tenantId,
          createdAt: { gte: startDate },
        },
      }),
    ]);

    return {
      conversations,
      agents,
      kbArticles,
    };
  }

  /**
   * Time-Range Start berechnen
   */
  private getTimeRangeStart(timeRange: string): Date {
    const now = new Date();
    const ranges: Record<string, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };

    const ms = ranges[timeRange] || ranges['1h'];
    return new Date(now.getTime() - ms);
  }
}

