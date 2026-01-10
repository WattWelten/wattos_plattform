import { Module } from '@nestjs/common';
import { PrismaModule } from '@wattweiser/db';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { KpiCalculationService } from './kpi-calculation.service';
import { TrendAnalysisService } from './trend-analysis.service';
import { KpiService } from './kpi.service';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, KpiCalculationService, TrendAnalysisService, KpiService],
  exports: [AnalyticsService, KpiService],
})
export class AnalyticsModule {}

