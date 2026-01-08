import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
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
        const rateLimit = config.get<string>('RATE_LIMIT', '100r/m');
        const match = rateLimit.match(/^(\d+)r\/([smhd])$/);
        if (!match) {
          return [
            {
              ttl: 60000, // Default: 1 minute
              limit: 100, // Default: 100 requests
            },
          ];
        }
        const limit = parseInt(match[1], 10);
        const unit = match[2];
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
    AuthModule,
    ProxyModule,
    AuditModule,
    HealthModule,
  ],
  providers: [BodyLimitMiddleware],
})
export class AppModule implements NestModule {
  constructor(
    private authMiddleware: AuthMiddleware,
    private bodyLimitMiddleware: BodyLimitMiddleware,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    // Request-ID Middleware sollte zuerst ausgeführt werden
    consumer.apply(RequestIdMiddleware).forRoutes('*');
    // Body Limit Middleware (vor Body-Parsing)
    consumer.apply(this.bodyLimitMiddleware).forRoutes('*');
    // Request Logging Middleware danach
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
    // Auth Middleware für geschützte Routes (außer Health und Docs)
    consumer
      .apply(this.authMiddleware)
      .exclude(
        { path: 'api/health', method: RequestMethod.ALL },
        { path: 'api/docs', method: RequestMethod.ALL },
        { path: 'api/docs/(.*)', method: RequestMethod.ALL },
        { path: 'api/auth/login', method: RequestMethod.POST },
        { path: 'api/auth/register', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
