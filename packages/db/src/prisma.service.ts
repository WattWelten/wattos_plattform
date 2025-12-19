import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Optional, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MetricsService } from '@wattweiser/shared';

/**
 * PrismaService - Singleton Service für PrismaClient
 * Verhindert Connection Pool Exhaustion durch mehrfache Instanziierung
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(@Optional() @Inject(MetricsService) private metricsService?: MetricsService) {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    
    // Prisma Middleware für automatische Metrics-Collection
    this.$use(async (params, next) => {
      const start = Date.now();
      try {
        const result = await next(params);
        const duration = Date.now() - start;
        
        // Metrics Tracking
        if (this.metricsService) {
          this.metricsService.recordDbQuery(params.action, duration, true);
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        
        // Metrics Tracking für Fehler
        if (this.metricsService) {
          this.metricsService.recordDbQuery(params.action, duration, false);
        }
        
        throw error;
      }
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma Client connected to database');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to connect to database: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma Client disconnected from database');
  }
}




