import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { KPICalculationService } from './kpi-calculation.service';
import { TrendAnalysisService } from './trend-analysis.service';
import { CacheModule } from '@wattweiser/shared';

@Module({
  imports: [CacheModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    KPICalculationService,
    TrendAnalysisService,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

