/**
 * KPI Event Handler Service
 * 
 * Reagiert auf Datenänderungen (ConversationMessage, Feedback, Event)
 * und invalidiert den KPI-Cache für betroffene Tenants
 * 
 * Wird über Prisma Middleware oder Event Bus getriggert
 */

import { Injectable, Logger, OnModuleInit, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { KpiCacheService } from './kpi-cache.service';

@Injectable()
export class KpiEventHandlerService implements OnModuleInit {
  private readonly logger = new Logger(KpiEventHandlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(KpiCacheService) private readonly kpiCacheService?: KpiCacheService,
  ) {}

  async onModuleInit() {
    if (!this.kpiCacheService) {
      this.logger.warn('KpiCacheService not available, cache invalidation disabled');
      return;
    }

    // Setup Prisma Middleware für Cache-Invalidierung
    this.setupPrismaMiddleware();
    this.logger.log('KPI Event Handler initialized');
  }

  /**
   * Setup Prisma Middleware für automatische Cache-Invalidierung
   * Reagiert auf create/update/delete Operationen
   * 
   * Note: $use ist in Prisma 7.2.0 veraltet, wird aber noch unterstützt.
   * Eine Migration zu Prisma Client Extensions ist geplant.
   */
  private setupPrismaMiddleware(): void {
    try {
      // Prüfe ob $use existiert (veraltet in neueren Prisma-Versionen, aber funktioniert)
      const prismaClient = this.prisma.client as any;
      if (typeof prismaClient.$use === 'function') {
        // Typisierung: $use ist eine optionale Methode in PrismaClient
        type PrismaClientWithUse = typeof prismaClient & {
          $use?: (middleware: (params: any, next: (params: any) => Promise<any>) => Promise<any>) => void;
        };
        
        const client = prismaClient as PrismaClientWithUse;
        client.$use?.(async (params: any, next: (params: any) => Promise<any>) => {
          const result = await next(params);

          // Cache-Invalidierung nach erfolgreicher Operation
          if (this.shouldInvalidateCache(params)) {
            await this.invalidateCacheForOperation(params, result);
          }

          return result;
        });
      } else {
        this.logger.debug('Prisma $use middleware not available, using event-based invalidation');
      }
    } catch (error) {
      this.logger.warn(`Failed to setup Prisma middleware for cache invalidation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Prüfe ob Cache-Invalidierung für diese Operation notwendig ist
   */
  private shouldInvalidateCache(params: any): boolean {
    const relevantModels = ['ConversationMessage', 'Feedback', 'Event', 'Conversation'];
    const relevantActions = ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany'];

    return (
      relevantModels.includes(params.model) &&
      relevantActions.includes(params.action)
    );
  }

  /**
   * Invalidiere Cache für eine Operation
   */
  private async invalidateCacheForOperation(params: any, result: any): Promise<void> {
    if (!this.kpiCacheService) {
      return;
    }

    try {
      // Extrahiere Tenant-ID aus Operation (async)
      const tenantId = await this.extractTenantId(params, result);

      if (tenantId) {
        // Invalidiere Cache für alle Ranges (today, 7d, 30d)
        await this.kpiCacheService.invalidateTenantCache(tenantId);
        this.logger.debug(`Cache invalidated for tenant ${tenantId} after ${params.model}.${params.action}`);
      } else {
        this.logger.debug(`No tenant ID found for ${params.model}.${params.action}, skipping cache invalidation`);
      }
    } catch (error) {
      this.logger.warn(`Failed to invalidate cache after ${params.model}.${params.action}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extrahiere Tenant-ID aus Operation-Params oder Result
   */
  private async extractTenantId(params: any, result: any): Promise<string | null> {
    // 1. Prüfe ob tenantId direkt in params.data vorhanden ist
    if (params.data?.tenantId) {
      return params.data.tenantId;
    }

    // 2. Prüfe ob tenantId in where-Bedingung vorhanden ist
    if (params.args?.where?.tenantId) {
      return params.args.where.tenantId;
    }

    // 3. Prüfe ob Result ein Objekt mit tenantId ist
    if (result?.tenantId) {
      return result.tenantId;
    }

    // 4. Prüfe ob Result ein Array ist und erste Element tenantId hat
    if (Array.isArray(result) && result.length > 0 && result[0]?.tenantId) {
      return result[0].tenantId;
    }

    // 5. Für ConversationMessage: Hole tenantId über Conversation
    if (params.model === 'ConversationMessage') {
      const conversationId = params.data?.conversationId || result?.conversationId;
      if (conversationId) {
        try {
          const conversation = await this.prisma.client.conversation.findUnique({
            where: { id: conversationId },
            select: { tenantId: true },
          });
          if (conversation?.tenantId) {
            return conversation.tenantId;
          }
        } catch (error) {
          this.logger.warn(`Failed to load conversation ${conversationId} for cache invalidation: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return null;
  }

  /**
   * Manuelle Cache-Invalidierung (für externe Services)
   */
  async invalidateCacheForTenant(tenantId: string): Promise<void> {
    if (!this.kpiCacheService) {
      return;
    }

    try {
      await this.kpiCacheService.invalidateTenantCache(tenantId);
      this.logger.debug(`Cache invalidated for tenant ${tenantId} (manual)`);
    } catch (error) {
      this.logger.warn(`Failed to invalidate cache for tenant ${tenantId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
