import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '@wattweiser/db';
import { CacheModule } from '@wattweiser/shared';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { KpiService } from './kpi.service';
import { KpiMetricsService } from './kpi-metrics.service';
import { KpiAlertsService } from './kpi-alerts.service';
import { KpiCacheService } from './kpi-cache.service';
import { KpiEventHandlerService } from './kpi-event-handler.service';
import { TrendAnalysisService } from './trend-analysis.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    AuthModule,
    CacheModule, // Redis-Caching für KPIs
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    KpiService,
    KpiMetricsService,
    KpiAlertsService,
    KpiCacheService,
    KpiEventHandlerService, // Event-Handler für Cache-Invalidierung
    TrendAnalysisService, // Trend-Analysen Service
  ],
  exports: [AnalyticsService, KpiService, KpiMetricsService, KpiAlertsService, KpiCacheService, KpiEventHandlerService, TrendAnalysisService],
})
export class AnalyticsModule {}

