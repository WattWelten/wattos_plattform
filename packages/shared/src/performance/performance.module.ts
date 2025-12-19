import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PerformanceService } from './performance.service';

/**
 * Performance Module
 * Globales Modul für Performance-Monitoring
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}

