import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { KpiService, KpiRange } from './kpi.service';
import { KpiMetricsService } from './kpi-metrics.service';
import { KpiAlertsService } from './kpi-alerts.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly kpiService: KpiService,
    private readonly kpiMetricsService: KpiMetricsService,
    private readonly kpiAlertsService: KpiAlertsService,
  ) {}

  @Get(':tenantId')
  async getAnalytics(
    @Param('tenantId') tenantId: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return await this.analyticsService.getAnalytics(tenantId, {
      timeRange: timeRange || '7d',
    });
  }

  /**
   * KPI-Endpoint für Multi-Tenant Analytics
   * GET /analytics/kpi/:tenantId?range=7d
   */
  @Get('kpi/:tenantId')
  async getKpis(
    @Param('tenantId') tenantId: string,
    @Query('range') range?: string,
  ) {
    const kpiRange: KpiRange =
      range === 'today' || range === '7d' || range === '30d'
        ? range
        : '7d';

    const kpis = await this.kpiService.getKpis(tenantId, kpiRange);

    return {
      tenantId,
      range: kpiRange,
      ...kpis,
    };
  }
}

