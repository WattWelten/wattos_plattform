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
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// WICHTIG: Lade .env Dateien MANUELL, bevor validateEnv() aufgerufen wird
// ConfigModule lädt sie nicht automatisch in process.env
// Ermittle Projekt-Root: Wenn wir in apps/gateway sind, gehe ein Verzeichnis nach oben
let projectRoot = process.cwd();
const cwdPath = path.normalize(projectRoot);

// Prüfe ob wir bereits im apps/gateway Verzeichnis sind
if (cwdPath.endsWith(path.join('apps', 'gateway')) || cwdPath.endsWith('apps\\gateway')) {
  // Wir sind in apps/gateway, gehe ein Verzeichnis nach oben zum Projekt-Root
  projectRoot = path.resolve(projectRoot, '..', '..');
  console.log('🔍 [Gateway] Detected we are in apps/gateway, adjusting project root');
}

const gatewayDir = path.resolve(projectRoot, 'apps', 'gateway');
const rootEnvPath = path.resolve(projectRoot, '.env');
const envPath = path.resolve(gatewayDir, '.env');
const envLocalPath = path.resolve(gatewayDir, '.env.local');

// Debug: IMMER anzeigen (nicht nur in development)
console.log('🔍 [Gateway] Loading .env files...');
console.log(`  process.cwd(): ${process.cwd()}`);
console.log(`  projectRoot (adjusted): ${projectRoot}`);
console.log(`  Root .env: ${rootEnvPath}`);
console.log(`  Gateway .env: ${envPath}`);
console.log(`  Gateway .env.local: ${envLocalPath}`);

// Prüfe ob Dateien existieren
console.log(`  Root .env exists: ${fs.existsSync(rootEnvPath)}`);
console.log(`  Gateway .env exists: ${fs.existsSync(envPath)}`);
console.log(`  Gateway .env.local exists: ${fs.existsSync(envLocalPath)}`);

// Lade in dieser Reihenfolge (spätere überschreiben frühere)
const rootResult = dotenv.config({ path: rootEnvPath });
const envResult = dotenv.config({ path: envPath });
const envLocalResult = dotenv.config({ path: envLocalPath });

// Debug: IMMER anzeigen
console.log('🔍 [Gateway] .env loading results:');
if (rootResult.error) {
  if ((rootResult.error as NodeJS.ErrnoException).code === 'ENOENT') {
    console.log('  ⚠️ Root .env not found (optional)');
  } else {
    console.warn(`  ⚠️ Root .env error: ${rootResult.error.message}`);
  }
} else {
  console.log('  ✅ Root .env loaded');
}

if (envResult.error) {
  if ((envResult.error as NodeJS.ErrnoException).code === 'ENOENT') {
    console.log('  ⚠️ Gateway .env not found (REQUIRED!)');
  } else {
    console.warn(`  ⚠️ Gateway .env error: ${envResult.error.message}`);
  }
} else {
  console.log('  ✅ Gateway .env loaded');
}

if (envLocalResult.error) {
  if ((envLocalResult.error as NodeJS.ErrnoException).code === 'ENOENT') {
    console.log('  ⚠️ Gateway .env.local not found (optional)');
  } else {
    console.warn(`  ⚠️ Gateway .env.local error: ${envLocalResult.error.message}`);
  }
} else {
  console.log('  ✅ Gateway .env.local loaded');
}

// Debug: Zeige geladene Variablen (nur die kritischen)
console.log('🔍 [Gateway] Critical env vars after loading:');
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set (' + process.env.DATABASE_URL.substring(0, 30) + '...)' : '❌ Missing'}`);
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set (' + process.env.JWT_SECRET.length + ' chars)' : '❌ Missing'}`);

// Validate environment variables on module load (NACH dem Laden der .env Dateien)
try {
  validateEnv();
  console.log('✅ [Gateway] Environment variables validated successfully');
} catch (error) {
  console.error('❌ [Gateway] Environment variable validation failed:');
  if (error instanceof Error) {
    console.error(error.message);
  }
  // Debug: IMMER anzeigen (nicht nur in development)
  console.error('🔍 [Gateway] Current process.env keys (filtered):', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('JWT')));
  console.error(`🔍 [Gateway] DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.error(`🔍 [Gateway] JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
  process.exit(1);
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../.env'], // Suche .env in Gateway-Verzeichnis und Root
      // Validierung erfolgt bereits oben nach manuellem Laden der .env Dateien
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
    // Auth Middleware für geschützte Routes (außer Health, Docs, Auth und OPTIONS-Requests)
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/*', method: RequestMethod.ALL },
        { path: 'docs', method: RequestMethod.ALL },
        { path: 'docs/*', method: RequestMethod.ALL },
        { path: 'auth/login', method: RequestMethod.ALL }, // ALL für OPTIONS-Preflight
        { path: 'auth/register', method: RequestMethod.ALL }, // ALL für OPTIONS-Preflight
        { path: '*', method: RequestMethod.OPTIONS }, // Alle OPTIONS-Requests ausschließen (CORS Preflight)
      )
      .forRoutes('*');
  }
}
