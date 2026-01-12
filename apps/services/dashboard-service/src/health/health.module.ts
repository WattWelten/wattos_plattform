import { Module } from '@nestjs/common';
import { PrismaModule } from '@wattweiser/db';
import { CacheModule } from '@wattweiser/shared';
import { AnalyticsModule } from '../analytics/analytics.module';
import { DashboardHealthService } from './dashboard-health.service';
import { DashboardHealthController } from './dashboard-health.controller';

@Module({
  imports: [PrismaModule, CacheModule, AnalyticsModule],
  controllers: [DashboardHealthController],
  providers: [DashboardHealthService],
  exports: [DashboardHealthService],
})
export class HealthModule {}
