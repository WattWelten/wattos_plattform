/**
 * KPI Metrics Service
 * 
 * Integriert KPI-Daten in Metrics-Service für Monitoring
 */

import { Injectable, Logger } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { PrismaService } from '@wattweiser/db';

@Injectable()
export class KpiMetricsService {
  private readonly logger = new Logger(KpiMetricsService.name);

  constructor(
    private readonly kpiService: KpiService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Exportiere KPIs als Metrics für Monitoring
   */
  async exportKpiMetrics(tenantId: string, range: 'today' | '7d' | '30d' = '7d') {
    try {
      const kpis = await this.kpiService.getKpis(tenantId, range);

      // Exportiere als Metrics (z.B. Prometheus, Datadog)
      const metrics = {
        'kpi.answered': kpis.answered,
        'kpi.self_service_rate': kpis.selfServiceRate,
        'kpi.fully_solved': kpis.fullySolved,
        'kpi.time_saved_hours': kpis.timeSavedHours,
        'kpi.fte_saved': kpis.fteSaved,
        'kpi.after_hours_percent': kpis.afterHoursPercent,
        'kpi.coverage_rate': kpis.coverageRate,
        'kpi.p95_latency_ms': kpis.p95LatencyMs,
        'kpi.csat': kpis.csat,
      };

      // Hier würde die Integration mit dem Metrics-Service erfolgen
      // z.B. this.metricsService.record('kpi.answered', kpis.answered, { tenantId, range });

      this.logger.debug(`Exported KPI metrics for tenant ${tenantId}`);

      return metrics;
    } catch (error) {
      this.logger.error(`Failed to export KPI metrics: ${error}`);
      throw error;
    }
  }

  /**
   * Prüfe Alerts für kritische KPIs
   */
  async checkAlerts(tenantId: string) {
    const kpis = await this.kpiService.getKpis(tenantId, '7d');
    const alerts: string[] = [];

    // CSAT Alert
    if (kpis.csat < 3.0) {
      alerts.push(`CSAT kritisch: ${kpis.csat.toFixed(1)}/5.0`);
    }

    // P95 Latency Alert
    if (kpis.p95LatencyMs > 5000) {
      alerts.push(`P95 Latenz hoch: ${kpis.p95LatencyMs}ms`);
    }

    // Self-Service Rate Alert
    if (kpis.selfServiceRate < 0.5) {
      alerts.push(`Self-Service-Quote niedrig: ${(kpis.selfServiceRate * 100).toFixed(1)}%`);
    }

    // Coverage Rate Alert
    if (kpis.coverageRate < 0.7) {
      alerts.push(`Abdeckungsgrad niedrig: ${(kpis.coverageRate * 100).toFixed(1)}%`);
    }

    return alerts;
  }
}
