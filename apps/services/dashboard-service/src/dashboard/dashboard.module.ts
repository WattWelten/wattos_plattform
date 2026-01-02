import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardDataAggregationService } from './dashboard-data-aggregation.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [AnalyticsModule, MetricsModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardDataAggregationService],
  exports: [DashboardService],
})
export class DashboardModule {}

