import { Controller, Get, Query } from '@nestjs/common';
import { MetricsDashboardService } from './metrics-dashboard.service';

/**
 * Metrics Dashboard Controller
 * 
 * REST API für Metrics-Dashboard
 */
@Controller('dashboard/metrics')
export class MetricsDashboardController {
  constructor(private readonly metricsDashboardService: MetricsDashboardService) {}

  /**
   * Dashboard-Übersicht abrufen
   */
  @Get('overview')
  async getDashboardOverview(
    @Query('tenantId') tenantId?: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return await this.metricsDashboardService.getDashboardOverview(
      tenantId,
      timeRange || '24h',
    );
  }

  /**
   * Metrics für Chart abrufen
   */
  @Get('chart')
  async getMetricsForChart(
    @Query('tenantId') tenantId?: string,
    @Query('metric') metric?: string,
    @Query('timeRange') timeRange?: string,
    @Query('interval') interval?: string,
  ) {
    return await this.metricsDashboardService.getMetricsForChart(
      tenantId,
      metric || 'http_requests',
      timeRange || '24h',
      interval || '1h',
    );
  }

  /**
   * Service-Metriken abrufen
   */
  @Get('services')
  async getServiceMetrics(
    @Query('tenantId') tenantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.metricsDashboardService.getServiceMetrics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}


