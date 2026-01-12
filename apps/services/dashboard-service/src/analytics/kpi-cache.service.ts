/**
 * KPI Cache Service
 * 
 * Verwaltet Cache-Invalidierung für KPI-Daten
 * Wird aufgerufen wenn neue Daten hinzugefügt werden (ConversationMessage, Feedback, etc.)
 */

import { Injectable, Logger, Inject, Optional, OnModuleInit } from '@nestjs/common';
import { CacheService } from '@wattweiser/shared';

@Injectable()
export class KpiCacheService implements OnModuleInit {
  private readonly logger = new Logger(KpiCacheService.name);
  private readonly cacheEnabled: boolean;

  constructor(
    @Optional() @Inject(CacheService) private readonly cacheService?: CacheService,
  ) {
    this.cacheEnabled = !!this.cacheService;
  }

  async onModuleInit() {
    if (this.cacheEnabled) {
      this.logger.log('KPI Cache Service initialized');
    } else {
      this.logger.warn('KPI Cache Service: CacheService not available, caching disabled');
    }
  }

  /**
   * Invalidiere KPI-Cache für einen Tenant
   * Wird aufgerufen wenn neue Daten hinzugefügt werden
   */
  async invalidateTenantCache(tenantId: string): Promise<void> {
    if (!this.cacheEnabled || !this.cacheService) {
      return;
    }

    try {
      // Lösche alle Cache-Keys für diesen Tenant
      const patterns = [
        `kpi:${tenantId}:today`,
        `kpi:${tenantId}:7d`,
        `kpi:${tenantId}:30d`,
      ];

      for (const key of patterns) {
        await this.cacheService.delete(key);
      }

      this.logger.debug(`KPI cache invalidated for tenant: ${tenantId}`);
    } catch (error) {
      this.logger.warn(`Failed to invalidate KPI cache for tenant ${tenantId}: ${error}`);
    }
  }

  /**
   * Invalidiere KPI-Cache für einen Tenant und Range
   */
  async invalidateTenantRangeCache(tenantId: string, range: 'today' | '7d' | '30d'): Promise<void> {
    if (!this.cacheEnabled || !this.cacheService) {
      return;
    }

    try {
      const key = `kpi:${tenantId}:${range}`;
      await this.cacheService.delete(key);
      this.logger.debug(`KPI cache invalidated for tenant: ${tenantId}, range: ${range}`);
    } catch (error) {
      this.logger.warn(`Failed to invalidate KPI cache for tenant ${tenantId}, range ${range}: ${error}`);
    }
  }
}
