import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';

/**
 * Metrics Controller
 * 
 * REST API für Metrics-Export und -Abfrage
 */
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Prometheus Metrics exportieren
   */
  @Get('prometheus')
  async getPrometheusMetrics(): Promise<string> {
    return await this.metricsService.exportPrometheus();
  }

  /**
   * Metriken aus DB abrufen
   */
  @Get()
  async getMetrics(
    @Query('tenantId') tenantId?: string,
    @Query('service') service?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.metricsService.getMetrics(
      tenantId,
      service,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}


