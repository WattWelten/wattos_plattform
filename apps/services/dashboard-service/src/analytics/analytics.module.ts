import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '@wattweiser/db';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { KpiCalculationService } from './kpi-calculation.service';
import { TrendAnalysisService } from './trend-analysis.service';
import { KpiService } from './kpi.service';
import { KpiMetricsService } from './kpi-metrics.service';
import { KpiAlertsService } from './kpi-alerts.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    KpiCalculationService,
    TrendAnalysisService,
    KpiService,
    KpiMetricsService,
    KpiAlertsService,
  ],
  exports: [AnalyticsService, KpiService, KpiMetricsService, KpiAlertsService],
})
export class AnalyticsModule {}

