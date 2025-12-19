import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardDataAggregationService } from './dashboard-data-aggregation.service';
import { CacheModule } from '@wattweiser/shared';

@Module({
  imports: [CacheModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardDataAggregationService,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}


