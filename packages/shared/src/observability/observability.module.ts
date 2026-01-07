import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StructuredLoggerService } from './logger.service';
import { MetricsService } from './metrics.service';
import { HealthService } from './health.service';
import { RequestIdMiddleware } from './request-id.middleware';
import { RequestLoggingMiddleware } from './request-logging.middleware';
import { OpenTelemetryService } from './opentelemetry.service';

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
    HealthService,
    RequestIdMiddleware,
    RequestLoggingMiddleware,
    OpenTelemetryService,
  ],
  exports: [
    StructuredLoggerService,
    MetricsService,
    HealthService,
    RequestIdMiddleware,
    RequestLoggingMiddleware,
    OpenTelemetryService,
  ],
})
export class ObservabilityModule {}











