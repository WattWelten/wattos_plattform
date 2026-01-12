/**
 * Dashboard Health Service
 * 
 * Erweiterte Health Checks für Dashboard-Service:
 * - KPI Views (vw_kpi_answered, vw_kpi_self_service, etc.)
 * - Cache-Service (Redis)
 * - KPI Service Health
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { CacheService } from '@wattweiser/shared';
import { KpiService } from '../analytics/kpi.service';

export interface DashboardHealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks: {
    database?: { status: 'up' | 'down'; message?: string; responseTime?: number };
    redis?: { status: 'up' | 'down'; message?: string; responseTime?: number };
    cache_service?: { status: 'up' | 'down'; message?: string };
    views?: {
      status: 'up' | 'down';
      message?: string;
      views: Array<{ name: string; status: 'up' | 'down'; message?: string }>;
    };
    kpi_service?: { status: 'up' | 'down'; message?: string; cacheMetrics?: any };
  };
}

@Injectable()
export class DashboardHealthService {
  private readonly logger = new Logger(DashboardHealthService.name);
  private readonly requiredViews = [
    'vw_kpi_answered',
    'vw_kpi_self_service',
    'vw_kpi_after_hours',
    'vw_kpi_top_topics',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly kpiService: KpiService,
  ) {}

  /**
   * Vollständiger Health Check für Dashboard-Service
   */
  async checkHealth(): Promise<DashboardHealthCheckResult> {
    const checks: DashboardHealthCheckResult['checks'] = {};

    // Database Check
    checks.database = await this.checkDatabase();

    // Redis Check
    checks.redis = await this.checkRedis();

    // Cache Service Check
    checks.cache_service = await this.checkCacheService();

    // Views Check
    checks.views = await this.checkViews();

    // KPI Service Check
    checks.kpi_service = await this.checkKpiService();

    // Gesamtstatus bestimmen
    const criticalDown = checks.database?.status === 'down';
    const viewsDown = checks.views?.status === 'down';
    const someDown = Object.values(checks).some((check) => {
      if (check && typeof check === 'object' && 'status' in check) {
        return check.status === 'down';
      }
      return false;
    });

    let status: 'healthy' | 'unhealthy' | 'degraded';
    if (criticalDown) {
      status = 'unhealthy';
    } else if (viewsDown || someDown) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  /**
   * Database Health Check
   */
  private async checkDatabase(): Promise<{ status: 'up' | 'down'; message?: string; responseTime?: number }> {
    const startTime = Date.now();
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;
      return { status: 'up', responseTime };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { status: 'down', message: errorMessage, responseTime };
    }
  }

  /**
   * Redis Health Check
   */
  private async checkRedis(): Promise<{ status: 'up' | 'down'; message?: string; responseTime?: number }> {
    const startTime = Date.now();
    try {
      // Test Cache-Service (verwendet Redis intern)
      await this.cacheService.set('health:check', 'ok', 10);
      const value = await this.cacheService.get('health:check');
      await this.cacheService.delete('health:check');

      if (value === 'ok') {
        const responseTime = Date.now() - startTime;
        return { status: 'up', responseTime };
      } else {
        const responseTime = Date.now() - startTime;
        return { status: 'down', message: 'Cache read/write failed', responseTime };
      }
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { status: 'down', message: errorMessage, responseTime };
    }
  }

  /**
   * Cache Service Health Check
   */
  private async checkCacheService(): Promise<{ status: 'up' | 'down'; message?: string }> {
    try {
      // Prüfe ob Cache-Service verfügbar ist
      const testKey = 'health:cache:check';
      await this.cacheService.set(testKey, 'ok', 10);
      const value = await this.cacheService.get(testKey);
      await this.cacheService.delete(testKey);

      if (value === 'ok') {
        return { status: 'up' };
      } else {
        return { status: 'down', message: 'Cache service not responding correctly' };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { status: 'down', message: errorMessage };
    }
  }

  /**
   * Views Health Check
   * Prüft ob alle erforderlichen KPI Views existieren
   */
  private async checkViews(): Promise<{
    status: 'up' | 'down';
    message?: string;
    views: Array<{ name: string; status: 'up' | 'down'; message?: string }>;
  }> {
    const views: Array<{ name: string; status: 'up' | 'down'; message?: string }> = [];

    for (const viewName of this.requiredViews) {
      try {
        // Prüfe ob View existiert durch einfache Query
        await this.prisma.client.$queryRawUnsafe(`SELECT 1 FROM ${viewName} LIMIT 1`);
        views.push({ name: viewName, status: 'up' });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        views.push({ name: viewName, status: 'down', message: errorMessage });
      }
    }

    const allUp = views.every((v) => v.status === 'up');
    return {
      status: allUp ? 'up' : 'down',
      message: allUp ? undefined : 'Some views are missing or inaccessible',
      views,
    };
  }

  /**
   * KPI Service Health Check
   * Prüft ob KPI Service funktioniert und gibt Cache-Metriken zurück
   */
  private async checkKpiService(): Promise<{ status: 'up' | 'down'; message?: string; cacheMetrics?: any }> {
    try {
      // Hole Cache-Metriken
      const cacheMetrics = this.kpiService.getCacheMetrics();

      // Prüfe ob Service grundsätzlich funktioniert
      // (keine echte KPI-Berechnung, nur Metriken-Abfrage)
      return {
        status: 'up',
        cacheMetrics: {
          cacheHitRate: cacheMetrics.cacheHitRate,
          cacheHits: cacheMetrics.cacheHits,
          cacheMisses: cacheMetrics.cacheMisses,
          viewFallbacks: cacheMetrics.viewFallbacks,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { status: 'down', message: errorMessage };
    }
  }
}
