import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { MetricsService } from './metrics.service';

/**
 * Health Check Controller
 * Standardisierte Health Check Endpunkte für alle Services
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly metricsService?: MetricsService,
  ) {}

  /**
   * Liveness Probe
   * Kubernetes/Docker verwendet dies um zu prüfen ob Container läuft
   */
  @Get('liveness')
  async liveness() {
    return this.healthService.liveness();
  }

  /**
   * Readiness Probe
   * Kubernetes/Docker verwendet dies um zu prüfen ob Service bereit ist
   */
  @Get('readiness')
  async readiness() {
    return this.healthService.readiness();
  }

  /**
   * Vollständiger Health Check
   * Prüft alle Dependencies (DB, Redis, externe Services)
   */
  @Get()
  async health() {
    return this.healthService.checkHealth();
  }

  /**
   * Metrics Endpoint (Prometheus-Format)
   */
  @Get('metrics')
  async metrics() {
    if (!this.metricsService) {
      return '# Metrics service not available\n';
    }
    return this.metricsService.exportPrometheus();
  }

  /**
   * KPI Endpoint (JSON-Format für Dashboards)
   */
  @Get('kpi')
  async kpi() {
    if (!this.metricsService) {
      return { error: 'Metrics service not available' };
    }
    return this.metricsService.getKpiMetrics(60); // Letzte 60 Minuten
  }
}











