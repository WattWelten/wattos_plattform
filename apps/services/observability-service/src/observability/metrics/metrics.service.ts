import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import * as promClient from 'prom-client';

/**
 * Metrics Service
 * 
 * Prometheus-kompatible Metrics-Collection
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly prisma: PrismaClient;
  private readonly register: promClient.Registry;

  // Prometheus Metrics
  private readonly httpRequestsTotal: promClient.Counter<string>;
  private readonly httpRequestDuration: promClient.Histogram<string>;
  private readonly llmCallsTotal: promClient.Counter<string>;
  private readonly llmTokensTotal: promClient.Counter<string>;
  private readonly llmCostTotal: promClient.Counter<string>;
  private readonly dbQueriesTotal: promClient.Counter<string>;
  private readonly dbQueryDuration: promClient.Histogram<string>;
  private readonly cacheOperationsTotal: promClient.Counter<string>;

  constructor() {
    this.prisma = new PrismaClient();
    this.register = new promClient.Registry();

    // HTTP Metrics
    this.httpRequestsTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'service'],
      registers: [this.register],
    });

    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
      registers: [this.register],
    });

    // LLM Metrics
    this.llmCallsTotal = new promClient.Counter({
      name: 'llm_calls_total',
      help: 'Total number of LLM API calls',
      labelNames: ['provider', 'model', 'service'],
      registers: [this.register],
    });

    this.llmTokensTotal = new promClient.Counter({
      name: 'llm_tokens_total',
      help: 'Total number of LLM tokens',
      labelNames: ['provider', 'model', 'type', 'service'],
      registers: [this.register],
    });

    this.llmCostTotal = new promClient.Counter({
      name: 'llm_cost_usd',
      help: 'Total LLM cost in USD',
      labelNames: ['provider', 'model', 'service'],
      registers: [this.register],
    });

    // Database Metrics
    this.dbQueriesTotal = new promClient.Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'success', 'service'],
      registers: [this.register],
    });

    this.dbQueryDuration = new promClient.Histogram({
      name: 'db_query_duration_ms',
      help: 'Database query duration in milliseconds',
      labelNames: ['operation', 'service'],
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
      registers: [this.register],
    });

    // Cache Metrics
    this.cacheOperationsTotal = new promClient.Counter({
      name: 'cache_operations_total',
      help: 'Total number of cache operations',
      labelNames: ['operation', 'service'],
      registers: [this.register],
    });

    // Default Metrics (CPU, Memory, etc.)
    promClient.collectDefaultMetrics({ register: this.register });
  }

  /**
   * HTTP Request Metrik aufzeichnen
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    service: string,
  ): void {
    const normalizedRoute = this.normalizeRoute(route);
    
    this.httpRequestsTotal.inc({
      method,
      route: normalizedRoute,
      status_code: statusCode.toString(),
      service,
    });

    this.httpRequestDuration.observe(
      {
        method,
        route: normalizedRoute,
        status_code: statusCode.toString(),
        service,
      },
      duration,
    );

    // In DB speichern (optional, für historische Analyse)
    this.saveMetricToDb(service, 'http_request', duration, {
      method,
      route: normalizedRoute,
      statusCode,
    }).catch((err) => {
      this.logger.warn(`Failed to save metric to DB: ${err.message}`);
    });
  }

  /**
   * LLM Call Metrik aufzeichnen
   */
  recordLlmCall(
    provider: string,
    model: string,
    tokens: number,
    cost: number,
    duration: number,
    service: string,
    tokenType: 'input' | 'output' = 'input',
  ): void {
    this.llmCallsTotal.inc({ provider, model, service });
    this.llmTokensTotal.inc({ provider, model, type: tokenType, service }, tokens);
    this.llmCostTotal.inc({ provider, model, service }, cost);

    this.saveMetricToDb(service, 'llm_call', duration, {
      provider,
      model,
      tokens,
      cost,
      tokenType,
    }).catch((err) => {
      this.logger.warn(`Failed to save metric to DB: ${err.message}`);
    });
  }

  /**
   * Database Query Metrik aufzeichnen
   */
  recordDbQuery(
    operation: string,
    duration: number,
    success: boolean,
    service: string,
  ): void {
    this.dbQueriesTotal.inc({
      operation,
      success: success.toString(),
      service,
    });

    this.dbQueryDuration.observe({ operation, service }, duration);

    this.saveMetricToDb(service, 'db_query', duration, {
      operation,
      success,
    }).catch((err) => {
      this.logger.warn(`Failed to save metric to DB: ${err.message}`);
    });
  }

  /**
   * Cache Operation Metrik aufzeichnen
   */
  recordCacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    service: string,
  ): void {
    this.cacheOperationsTotal.inc({ operation, service });
  }

  /**
   * Metriken im Prometheus-Format exportieren
   */
  async exportPrometheus(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Metriken aus DB abrufen
   */
  async getMetrics(
    tenantId?: string,
    service?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const metrics = await this.prisma.metric.findMany({
      where: {
        ...(tenantId && { tenantId }),
        ...(service && { service }),
        ...(startDate && { timestamp: { gte: startDate } }),
        ...(endDate && { timestamp: { lte: endDate } }),
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 1000,
    });

    return metrics;
  }

  /**
   * Metrik in DB speichern
   */
  private async saveMetricToDb(
    service: string,
    name: string,
    value: number,
    tags: Record<string, any>,
    tenantId?: string,
  ): Promise<void> {
    // Nur alle 10 Sekunden speichern, um DB-Load zu reduzieren
    // In Production: Batch-Insert verwenden
    await this.prisma.metric.create({
      data: {
        tenantId: tenantId || null,
        service,
        name,
        value,
        tags: tags as any,
      },
    });
  }

  /**
   * Route normalisieren für Metriken
   */
  private normalizeRoute(route: string): string {
    return route
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/gi, '/:uuid')
      .replace(/\/[a-zA-Z0-9-_]+/g, (match) => {
        // Ersetze nur wenn es nicht bereits ein Parameter ist
        if (match.startsWith('/:')) {
          return match;
        }
        // Ersetze lange IDs durch Parameter
        if (match.length > 20) {
          return '/:id';
        }
        return match;
      });
  }
}

