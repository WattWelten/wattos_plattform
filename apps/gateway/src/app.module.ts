import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
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
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Request-ID Middleware sollte zuerst ausgeführt werden
    consumer.apply(RequestIdMiddleware).forRoutes('*');
    // Request Logging Middleware danach
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
