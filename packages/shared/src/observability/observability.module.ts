import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StructuredLoggerService } from './logger.service';
import { MetricsService } from './metrics.service';
import { HealthService } from './health.service';
import { RequestIdMiddleware } from './request-id.middleware';
import { RequestLoggingMiddleware } from './request-logging.middleware';
import { OpenTelemetryService } from './opentelemetry.service';
import { SentryService } from './sentry';

/**
 * Observability Module
 * Globales Modul für Logging, Metrics und Health Checks
 * 
 * Hinweis: Middleware sollte in den einzelnen Service-Modulen konfiguriert werden
 * (z.B. in AppModule mit configure() Methode)
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    StructuredLoggerService,
    MetricsService,
    // HealthService wird nicht hier registriert, da es PrismaService benötigt
    // Es sollte in den einzelnen Services registriert werden (z.B. HealthModule)
    RequestIdMiddleware,
    RequestLoggingMiddleware,
    OpenTelemetryService,
    SentryService,
  ],
  exports: [
    StructuredLoggerService,
    MetricsService,
    // HealthService wird nicht exportiert
    RequestIdMiddleware,
    RequestLoggingMiddleware,
    OpenTelemetryService,
    SentryService,
  ],
})
export class ObservabilityModule {}











