import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

/**
 * Analytics Controller
 * 
 * REST API für Analytics-Daten
 */
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Analytics-Daten abrufen
   */
  @Get()
  async getAnalytics(
    @Query('tenantId') tenantId: string,
    @Query('timeRange') timeRange?: string,
    @Query('metrics') metrics?: string,
  ) {
    return await this.analyticsService.getAnalytics(tenantId, {
      timeRange,
      metrics: metrics ? metrics.split(',') : undefined,
    });
  }
}


