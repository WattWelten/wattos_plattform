import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Optional, Inject } from '@nestjs/common';
// PrismaClient wird zur Laufzeit generiert
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient wird nach `prisma generate` verfügbar sein
import { PrismaClient } from '@prisma/client';

// Optional: MetricsService from @wattweiser/shared (if available)
type MetricsService = {
  recordDbQuery: (action: string, duration: number, success: boolean) => void;
};

/**
 * PrismaService - Singleton Service für PrismaClient
 * Verhindert Connection Pool Exhaustion durch mehrfache Instanziierung
 * 
 * Verwendet Komposition statt Vererbung, um Decorator-Probleme zu vermeiden
 * und gleichzeitig alle PrismaClient-Methoden transparent zu delegieren
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public readonly client: PrismaClient;
  private readonly metricsService?: MetricsService;

  constructor(
    @Optional() @Inject('MetricsService') metricsService?: MetricsService,
  ) {
    this.metricsService = metricsService;
    
    // PrismaClient-Instanz erstellen
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - PrismaClient wird nach `prisma generate` verfügbar sein
    this.client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    
    // Prisma Middleware für automatische Metrics-Collection
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - $use wird nach Prisma-Generierung verfügbar sein
    (this.client as any).$use(async (params: any, next: any) => {
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

    // Proxy für transparente Delegation aller PrismaClient-Methoden
    // Dies ermöglicht die Verwendung von PrismaService wie PrismaClient
    return new Proxy(this, {
      get: (target, prop) => {
        // Eigene Methoden und Properties haben Priorität
        if (prop in target && typeof (target as any)[prop] !== 'undefined') {
          return (target as any)[prop];
        }
        // Alle anderen Zugriffe werden an PrismaClient delegiert
        return (target.client as any)[prop];
      },
    }) as PrismaService & PrismaClient;
  }

  async onModuleInit() {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - $connect wird nach Prisma-Generierung verfügbar sein
      await this.client.$connect();
      this.logger.log('Prisma Client connected to database');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to connect to database: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async onModuleDestroy() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - $disconnect wird nach Prisma-Generierung verfügbar sein
    await this.client.$disconnect();
    this.logger.log('Prisma Client disconnected from database');
  }

  /**
   * Direkter Zugriff auf PrismaClient (für erweiterte Nutzung)
   */
  get prisma(): PrismaClient {
    return this.client;
  }
}
