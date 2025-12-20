import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { DashboardDataAggregationService } from './dashboard-data-aggregation.service';
import { CacheService } from '@wattweiser/shared';

/**
 * Dashboard Service
 * 
 * Verwaltet Dashboard-Konfigurationen und -Daten
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly prisma: PrismaClient;
  private readonly cacheTTL = 300; // 5 Minuten

  constructor(
    private readonly dataAggregation: DashboardDataAggregationService,
    private readonly cache: CacheService,
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Dashboard für Tenant abrufen
   */
  async getDashboard(tenantId: string, dashboardId?: string): Promise<any> {
    const cacheKey = `dashboard:${tenantId}:${dashboardId || 'default'}`;
    
    // Cache-Check
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Dashboard loaded from cache: ${cacheKey}`);
      return cached;
    }

    // Dashboard aus DB laden oder Default erstellen
    let dashboard;
    if (dashboardId) {
      dashboard = await this.prisma.dashboard.findUnique({
        where: {
          id: dashboardId,
          tenantId,
        },
      });
    } else {
      // Default Dashboard laden oder erstellen
      dashboard = await this.prisma.dashboard.findFirst({
        where: {
          tenantId,
          isDefault: true,
        },
      });

      if (!dashboard) {
        dashboard = await this.createDefaultDashboard(tenantId);
      }
    }

    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }

    // Dashboard-Daten aggregieren
    // MVP: layout hat Vorrang, fallback zu config (Legacy)
    const layout = dashboard.layout || dashboard.config;
    const dashboardData = await this.dataAggregation.aggregateDashboardData(
      tenantId,
      { ...dashboard, layout },
    );

    // Cache speichern
    await this.cache.set(cacheKey, dashboardData, this.cacheTTL);

    return dashboardData;
  }

  /**
   * Dashboard erstellen
   */
  async createDashboard(
    tenantId: string,
    name: string,
    layout: any,
    isDefault = false,
  ): Promise<{
    id: string;
    name: string;
    layout: any;
    isDefault: boolean;
    createdAt: Date;
  }> {
    // Wenn Default, andere Defaults deaktivieren
    if (isDefault) {
      await this.prisma.dashboard.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const dashboard = await this.prisma.dashboard.create({
      data: {
        tenantId,
        name,
        layout: layout as any, // MVP: layout field wird verwendet
        config: {}, // Legacy: leeres config für Kompatibilität
        isDefault,
      },
    });

    // Cache invalidieren
    await this.cache.delete(`dashboard:${tenantId}:*`);

    return dashboard;
  }

  /**
   * Dashboard aktualisieren
   */
  async updateDashboard(
    tenantId: string,
    dashboardId: string,
    updates: {
      name?: string;
      layout?: any;
      isDefault?: boolean;
    },
  ): Promise<{
    id: string;
    name: string;
    layout: any;
    isDefault: boolean;
    updatedAt: Date;
  }> {
    // Wenn Default, andere Defaults deaktivieren
    if (updates.isDefault) {
      await this.prisma.dashboard.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const dashboard = await this.prisma.dashboard.update({
      where: {
        id: dashboardId,
        tenantId,
      },
      data: {
        ...updates,
        layout: updates.layout as any, // MVP: layout field wird verwendet
        config: updates.layout || {}, // Legacy: config als Fallback
      },
    });

    // Cache invalidieren
    await this.cache.delete(`dashboard:${tenantId}:${dashboardId}`);

    return dashboard;
  }

  /**
   * Dashboard löschen
   */
  async deleteDashboard(tenantId: string, dashboardId: string): Promise<void> {
    await this.prisma.dashboard.delete({
      where: {
        id: dashboardId,
        tenantId,
      },
    });

    // Cache invalidieren
    await this.cache.delete(`dashboard:${tenantId}:${dashboardId}`);
  }

  /**
   * Alle Dashboards für Tenant auflisten
   */
  async listDashboards(tenantId: string): Promise<Array<{
    id: string;
    name: string;
    isDefault: boolean;
    createdAt: Date;
  }>> {
    const dashboards = await this.prisma.dashboard.findMany({
      where: { tenantId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return dashboards;
  }

  /**
   * Default Dashboard erstellen
   */
  private async createDefaultDashboard(tenantId: string): Promise<{
    id: string;
    name: string;
    layout: any;
    isDefault: boolean;
  }> {
    const defaultLayout = {
      widgets: [
        {
          id: 'overview',
          type: 'overview',
          position: { x: 0, y: 0, w: 12, h: 4 },
        },
        {
          id: 'conversations',
          type: 'conversations',
          position: { x: 0, y: 4, w: 6, h: 4 },
        },
        {
          id: 'agents',
          type: 'agents',
          position: { x: 6, y: 4, w: 6, h: 4 },
        },
      ],
    };

    return await this.prisma.dashboard.create({
      data: {
        tenantId,
        name: 'Default Dashboard',
        layout: defaultLayout as any,
        isDefault: true,
      },
    });
  }
}
