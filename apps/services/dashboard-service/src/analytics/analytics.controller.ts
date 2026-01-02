import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':tenantId')
  async getAnalytics(
    @Param('tenantId') tenantId: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return await this.analyticsService.getAnalytics(tenantId, {
      timeRange: timeRange || '7d',
    });
  }
}

