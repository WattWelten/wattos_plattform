import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StructuredLoggerService } from './logger.service';
import { MetricsService } from './metrics.service';
import { HealthService } from './health.service';

/**
 * Observability Module
 * Globales Modul für Logging, Metrics und Health Checks
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [StructuredLoggerService, MetricsService, HealthService],
  exports: [StructuredLoggerService, MetricsService, HealthService],
})
export class ObservabilityModule {}











