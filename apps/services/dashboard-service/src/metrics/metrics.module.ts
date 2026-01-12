import { Module } from '@nestjs/common';
import { PrismaModule } from '@wattweiser/db';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { PrometheusController } from './prometheus.controller';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [PrismaModule, AnalyticsModule],
  controllers: [MetricsController, PrometheusController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}

