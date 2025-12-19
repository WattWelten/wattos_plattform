import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaClient } from '@wattweiser/db';

/**
 * Metrics Dashboard Service
 * 
 * Aggregiert Metrics-Daten für Dashboard-Visualisierung
 */
@Injectable()
export class MetricsDashboardService {
  private readonly logger = new Logger(MetricsDashboardService.name);
  private readonly prisma: PrismaClient;
  private readonly observabilityServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.prisma = new PrismaClient();
    this.observabilityServiceUrl =
      this.configService.get<string>('OBSERVABILITY_SERVICE_URL') ||
      'http://localhost:3020';
  }

  /**
   * Dashboard-Übersicht abrufen
   */
  async getDashboardOverview(
    tenantId?: string,
    timeRange: string = '24h',
  ): Promise<any> {
    const endDate = new Date();
    const startDate = this.getStartDate(timeRange);

    // Metrics aus Observability-Service abrufen
    const metrics = await this.getMetricsFromService(tenantId, startDate, endDate);

    // Metrics aus DB aggregieren
    const dbMetrics = await this.aggregateMetricsFromDb(tenantId, startDate, endDate);

    return {
      timeRange,
      period: {
        start: startDate,
        end: endDate,
      },
      overview: {
        totalRequests: dbMetrics.totalRequests,
        totalErrors: dbMetrics.totalErrors,
        avgResponseTime: dbMetrics.avgResponseTime,
        totalLlmCalls: dbMetrics.totalLlmCalls,
        totalLlmCost: dbMetrics.totalLlmCost,
        totalDbQueries: dbMetrics.totalDbQueries,
        cacheHitRate: dbMetrics.cacheHitRate,
      },
      metrics: {
        httpRequests: metrics.httpRequests,
        llmCalls: metrics.llmCalls,
        dbQueries: metrics.dbQueries,
        cacheOperations: metrics.cacheOperations,
      },
      services: await this.getServiceMetrics(tenantId, startDate, endDate),
    };
  }

  /**
   * Metrics für Chart abrufen
   */
  async getMetricsForChart(
    tenantId?: string,
    metric: string = 'http_requests',
    timeRange: string = '24h',
    interval: string = '1h',
  ): Promise<any[]> {
    const endDate = new Date();
    const startDate = this.getStartDate(timeRange);

    const metrics = await this.prisma.metric.findMany({
      where: {
        name: metric,
        ...(tenantId && { tenantId }),
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Gruppieren nach Intervall
    const grouped = this.groupByInterval(metrics, interval, startDate, endDate);

    return grouped.map((item) => ({
      timestamp: item.timestamp,
      value: item.value,
      ...item.tags,
    }));
  }

  /**
   * Service-Metriken abrufen
   */
  async getServiceMetrics(
    tenantId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const metrics = await this.prisma.metric.findMany({
      where: {
        ...(tenantId && { tenantId }),
        ...(startDate && { timestamp: { gte: startDate } }),
        ...(endDate && { timestamp: { lte: endDate } }),
      },
      select: {
        service: true,
        name: true,
        value: true,
        timestamp: true,
      },
    });

    // Nach Service gruppieren
    const serviceMap = new Map<string, any>();

    for (const metric of metrics) {
      if (!serviceMap.has(metric.service)) {
        serviceMap.set(metric.service, {
          service: metric.service,
          metrics: {},
        });
      }

      const service = serviceMap.get(metric.service);
      if (!service.metrics[metric.name]) {
        service.metrics[metric.name] = {
          total: 0,
          count: 0,
          avg: 0,
        };
      }

      service.metrics[metric.name].total += metric.value;
      service.metrics[metric.name].count += 1;
      service.metrics[metric.name].avg =
        service.metrics[metric.name].total / service.metrics[metric.name].count;
    }

    return Array.from(serviceMap.values());
  }

  /**
   * Metrics aus Observability-Service abrufen
   */
  private async getMetricsFromService(
    tenantId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.observabilityServiceUrl}/api/v1/metrics`, {
          params: {
            ...(tenantId && { tenantId }),
            ...(startDate && { startDate: startDate.toISOString() }),
            ...(endDate && { endDate: endDate.toISOString() }),
          },
        }),
      );

      return {
        httpRequests: response.data.filter((m: any) => m.name === 'http_request'),
        llmCalls: response.data.filter((m: any) => m.name === 'llm_call'),
        dbQueries: response.data.filter((m: any) => m.name === 'db_query'),
        cacheOperations: response.data.filter((m: any) => m.name === 'cache_operation'),
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch metrics from service: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        httpRequests: [],
        llmCalls: [],
        dbQueries: [],
        cacheOperations: [],
      };
    }
  }

  /**
   * Metrics aus DB aggregieren
   */
  private async aggregateMetricsFromDb(
    tenantId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const metrics = await this.prisma.metric.findMany({
      where: {
        ...(tenantId && { tenantId }),
        ...(startDate && { timestamp: { gte: startDate } }),
        ...(endDate && { timestamp: { lte: endDate } }),
      },
    });

    const httpRequests = metrics.filter((m) => m.name === 'http_request');
    const llmCalls = metrics.filter((m) => m.name === 'llm_call');
    const dbQueries = metrics.filter((m) => m.name === 'db_query');
    const cacheOperations = metrics.filter((m) => m.name === 'cache_operation');

    const totalRequests = httpRequests.length;
    const totalErrors = httpRequests.filter((m) => {
      const tags = m.tags as any;
      return tags?.statusCode && tags.statusCode >= 400;
    }).length;

    const avgResponseTime =
      httpRequests.reduce((sum, m) => sum + m.value, 0) / (totalRequests || 1);

    const totalLlmCalls = llmCalls.length;
    const totalLlmCost = llmCalls.reduce((sum, m) => {
      const tags = m.tags as any;
      return sum + (tags?.cost || 0);
    }, 0);

    const totalDbQueries = dbQueries.length;

    const cacheHits = cacheOperations.filter((m) => {
      const tags = m.tags as any;
      return tags?.operation === 'hit';
    }).length;
    const cacheMisses = cacheOperations.filter((m) => {
      const tags = m.tags as any;
      return tags?.operation === 'miss';
    }).length;
    const cacheHitRate =
      cacheHits + cacheMisses > 0 ? cacheHits / (cacheHits + cacheMisses) : 0;

    return {
      totalRequests,
      totalErrors,
      avgResponseTime,
      totalLlmCalls,
      totalLlmCost,
      totalDbQueries,
      cacheHitRate,
    };
  }

  /**
   * Start-Datum basierend auf Time-Range berechnen
   */
  private getStartDate(timeRange: string): Date {
    const now = new Date();
    const hours = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
      '90d': 24 * 90,
    }[timeRange] || 24;

    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }

  /**
   * Metrics nach Intervall gruppieren
   */
  private groupByInterval(
    metrics: any[],
    interval: string,
    startDate: Date,
    endDate: Date,
  ): any[] {
    const intervalMs = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    }[interval] || 60 * 60 * 1000;

    const groups = new Map<number, { timestamp: Date; value: number; tags: any }>();

    for (const metric of metrics) {
      const timestamp = new Date(metric.timestamp);
      const groupKey = Math.floor(timestamp.getTime() / intervalMs) * intervalMs;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          timestamp: new Date(groupKey),
          value: 0,
          tags: metric.tags || {},
        });
      }

      const group = groups.get(groupKey);
      if (group) {
        group.value += metric.value;
      }
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }
}

