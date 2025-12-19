import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';

/**
 * Metrics Controller
 * 
 * REST API für Metrics-Daten
 */
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Metrics abrufen
   */
  @Get()
  async getMetrics(
    @Query('tenantId') tenantId: string,
    @Query('types') types?: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return await this.metricsService.getMetrics(tenantId, {
      types: types ? types.split(',') : undefined,
      timeRange,
    });
  }
}


