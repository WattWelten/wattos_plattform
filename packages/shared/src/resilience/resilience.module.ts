import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CircuitBreakerService } from './circuit-breaker.service';
import { RetryService } from './retry.service';

/**
 * Resilience Module
 * Globales Modul für Circuit Breaker und Retry-Strategien
 */
@Global()
@Module({
  imports: [ConfigModule, ScheduleModule.forRoot()],
  providers: [CircuitBreakerService, RetryService],
  exports: [CircuitBreakerService, RetryService],
})
export class ResilienceModule {}










