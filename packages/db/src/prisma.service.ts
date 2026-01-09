import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Optional, Inject } from '@nestjs/common';
// PrismaClient wird zur Laufzeit generiert
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient wird nach `prisma generate` verfügbar sein
import { PrismaClient } from '@prisma/client';

// Optional: MetricsService from @wattweiser/shared (if available)
type MetricsService = {
  recordDbQuery: (operation: string, duration: number, success: boolean) => void;
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
  private readonly metricsService: MetricsService | undefined;

  constructor(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Decorators werden zur Laufzeit von NestJS verarbeitet
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
    this.setupQueryLogging();
  }

  /**
   * Setup Query Logging Middleware
   * Wird separat aufgerufen um zirkuläre Dependencies zu vermeiden
   * 
   * Hinweis: $use ist in neueren Prisma-Versionen veraltet, wird optional verwendet
   */
  private setupQueryLogging(): void {
    try {
      // Prüfe ob $use existiert (veraltet in neueren Prisma-Versionen)
      if (typeof (this.client as any).$use === 'function') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - $use wird nach Prisma-Generierung verfügbar sein (falls unterstützt)
        (this.client as any).$use(async (params: any, next: any) => {
          const start = Date.now();
          const operation = `${params.model || 'unknown'}.${params.action || 'unknown'}`;
          
          try {
            const result = await next(params);
            const duration = Date.now() - start;
            
            // Metrics Tracking
            if (this.metricsService) {
              this.metricsService.recordDbQuery(operation, duration, true);
            }
            
            return result;
          } catch (error) {
            const duration = Date.now() - start;
            
            // Metrics Tracking für Fehler
            if (this.metricsService) {
              this.metricsService.recordDbQuery(operation, duration, false);
            }
            
            throw error;
          }
        });
      } else {
        // $use nicht verfügbar (neue Prisma-Version) - Logging wird übersprungen
        this.logger.debug('Prisma $use middleware not available (using newer Prisma version)');
      }
    } catch (error) {
      // Fehler beim Setup ignorieren - Prisma funktioniert auch ohne Middleware
      this.logger.warn(`Failed to setup Prisma query logging: ${error instanceof Error ? error.message : String(error)}`);
    }
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
   * 
   * Verwendung: prismaService.prisma.user.findMany()
   * Oder: prismaService.client.user.findMany()
   */
  get prisma(): PrismaClient {
    return this.client;
  }
}

// Proxy für transparente Delegation aller PrismaClient-Methoden
// Wird außerhalb der Klasse erstellt, um Decorator-Probleme zu vermeiden
const createPrismaServiceProxy = <T extends PrismaService>(instance: T): T & PrismaClient => {
  return new Proxy(instance, {
    get: (target, prop) => {
      // Eigene Methoden und Properties haben Priorität
      if (prop in target && typeof (target as any)[prop] !== 'undefined') {
        const value = (target as any)[prop];
        // Wenn es eine Funktion ist, binde sie an die Instanz
        if (typeof value === 'function' && prop !== 'constructor') {
          return value.bind(target);
        }
        return value;
      }
      // Alle anderen Zugriffe werden an PrismaClient delegiert
      return (target.client as any)[prop];
    },
  }) as T & PrismaClient;
};

// Exportiere Factory-Funktion für erweiterte Nutzung
export { createPrismaServiceProxy };
