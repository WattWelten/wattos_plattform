import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FeedbackModule } from './feedback/feedback.module';
import { PrismaModule } from '@wattweiser/db';
import {
  ObservabilityModule,
  ResilienceModule,
  CacheModule,
  ServiceDiscoveryModule,
  RequestIdMiddleware,
  RequestLoggingMiddleware,
} from '@wattweiser/shared';
import { validateEnv } from '@wattweiser/config';
import { AuthMiddleware } from './auth/auth.middleware';
import { BodyLimitMiddleware } from './middleware/body-limit.middleware';
import { TenantMiddleware } from './middleware/tenant.middleware';
import { TenantsController } from './tenants/tenants.controller';

// Validate environment variables on module load
try {
  validateEnv();
} catch (error) {
  console.error('❌ Environment variable validation failed:');
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const rateLimit = (config.get<string>('RATE_LIMIT') || '100r/m') as string;
        const match = rateLimit.match(/^(\d+)r\/([smhd])$/);
        if (!match) {
          return [
            {
              ttl: 60000, // Default: 1 minute
              limit: 100, // Default: 100 requests
            },
          ];
        }
        const limit = parseInt(match[1]!, 10);
        const unit = match[2] || 'm';
        const ttlMap: Record<string, number> = {
          s: 1000, // seconds
          m: 60000, // minutes
          h: 3600000, // hours
          d: 86400000, // days
        };
        return [
          {
            ttl: ttlMap[unit] || 60000,
            limit,
          },
        ];
      },
    }),
    PrismaModule,
    ObservabilityModule,
    ResilienceModule,
    CacheModule,
    ServiceDiscoveryModule,
    HealthModule, // Health muss VOR ProxyModule sein, damit Routen nicht abgefangen werden
    AuthModule,
    FeatureFlagsModule,
    AnalyticsModule,
    FeedbackModule,
    ProxyModule,
    AuditModule,
  ],
  controllers: [TenantsController],
  providers: [
    BodyLimitMiddleware,
    TenantMiddleware,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  constructor() {}

  configure(consumer: MiddlewareConsumer) {
    // Request-ID Middleware sollte zuerst ausgeführt werden
    consumer.apply(RequestIdMiddleware).forRoutes('*');
    // Tenant-Resolver Middleware (früh, damit tenantId verfügbar ist)
    consumer.apply(TenantMiddleware).forRoutes('*');
    // Body Limit Middleware (vor Body-Parsing)
    consumer.apply(BodyLimitMiddleware).forRoutes('*');
    // Request Logging Middleware danach
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
    // Auth Middleware für geschützte Routes (außer Health und Docs)
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/*', method: RequestMethod.ALL },
        { path: 'docs', method: RequestMethod.ALL },
        { path: 'docs/*', method: RequestMethod.ALL },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
