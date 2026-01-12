import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from '@wattweiser/db';
// import { HttpModule } from '@nestjs/axios';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MetricsModule } from './metrics/metrics.module';
import { ReportingModule } from './reporting/reporting.module';
import { ObservabilityModule, HealthController, ServiceDiscoveryModule } from '@wattweiser/shared';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TenantMiddleware } from './middleware/tenant.middleware';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute (default)
      },
    ]),
    PrismaModule,
    ObservabilityModule,
    ServiceDiscoveryModule,
    HealthModule, // Dashboard-spezifische Health Checks
    // HttpModule,
    DashboardModule,
    AnalyticsModule,
    MetricsModule,
    ReportingModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Tenant-Middleware sollte früh ausgeführt werden
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
