import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { TraceService } from './trace.service';
import { MetricsService } from './metrics.service';

/**
 * Observability Module
 * 
 * Observability & Analytics
 */
@Module({
  imports: [EventsModule],
  providers: [TraceService, MetricsService],
  exports: [TraceService, MetricsService],
})
export class ObservabilityModule {}

