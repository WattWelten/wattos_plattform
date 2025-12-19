import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CircuitBreakerService } from './circuit-breaker.service';
import { RetryService } from './retry.service';

/**
 * Resilience Module
 * Globales Modul für Circuit Breaker und Retry-Strategien
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [CircuitBreakerService, RetryService],
  exports: [CircuitBreakerService, RetryService],
})
export class ResilienceModule {}











