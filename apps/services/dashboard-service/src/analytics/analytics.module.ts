import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { KpiCalculationService } from './kpi-calculation.service';
import { TrendAnalysisService } from './trend-analysis.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, KpiCalculationService, TrendAnalysisService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

