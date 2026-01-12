import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { DashboardDataAggregationService } from './dashboard-data-aggregation.service';
import { CacheService } from '@wattweiser/shared';
import { DashboardLayout, DashboardConfig, Dashboard } from '../common/interfaces/dashboard.interface';

/**
 * Dashboard Service
 * 
 * Verwaltet Dashboard-Konfigurationen und -Daten
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly cacheTTL = 300; // 5 Minuten

  constructor(
    private readonly prismaService: PrismaService,
    private readonly dataAggregation: DashboardDataAggregationService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Ruft ein Dashboard für einen Tenant ab
   * 
   * @param tenantId - UUID des Tenants
   * @param dashboardId - Optional: UUID des Dashboards. Wenn nicht angegeben, wird das Default-Dashboard zurückgegeben
   * @returns Promise<Dashboard & { widgets: Record<string, any> }> - Dashboard mit aggregierten Widget-Daten
   * 
   * @example
   * ```typescript
   * // Default Dashboard abrufen
   * const dashboard = await dashboardService.getDashboard('tenant-uuid');
   * 
   * // Spezifisches Dashboard abrufen
   * const dashboard = await dashboardService.getDashboard('tenant-uuid', 'dashboard-uuid');
   * ```
   * 
   * @throws {Error} Wenn Dashboard nicht gefunden wird
   * 
   * @remarks
   * - Verwendet Redis-Caching (TTL: 5 Minuten)
   * - Cache-Key: `dashboard:{tenantId}:{dashboardId || 'default'}`
   * - Aggregiert Widget-Daten parallel für bessere Performance
   */
  async getDashboard(tenantId: string, dashboardId?: string): Promise<Dashboard & { widgets: Record<string, any> }> {
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
      dashboard = await this.prismaService.client.dashboard.findUnique({
        where: {
          id: dashboardId,
          tenantId,
        },
      });
    } else {
      // Default Dashboard laden oder erstellen
      dashboard = await this.prismaService.client.dashboard.findFirst({
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
    const layout = (dashboard.layout || dashboard.config) as DashboardLayout;
    const dashboardData = await this.dataAggregation.aggregateDashboardData(
      tenantId,
      { ...dashboard, layout },
    );

    // Cache speichern
    await this.cache.set(cacheKey, dashboardData, this.cacheTTL);

    return dashboardData;
  }

  /**
   * Erstellt ein neues Dashboard für einen Tenant
   * 
   * @param tenantId - UUID des Tenants
   * @param name - Name des Dashboards
   * @param layout - Dashboard-Layout-Konfiguration
   * @param isDefault - Ob dies das Default-Dashboard sein soll (optional, default: false)
   * @returns Promise<Dashboard> - Das erstellte Dashboard
   * 
   * @example
   * ```typescript
   * const dashboard = await dashboardService.createDashboard(
   *   'tenant-uuid',
   *   'My Dashboard',
   *   { widgets: [...] },
   *   true // als Default setzen
   * );
   * ```
   * 
   * @remarks
   * - Wenn isDefault=true, werden alle anderen Default-Dashboards deaktiviert
   * - Invalidiert automatisch den Cache für diesen Tenant
   */
  async createDashboard(
    tenantId: string,
    name: string,
    layout: DashboardLayout,
    isDefault = false,
  ): Promise<Dashboard> {
    // Wenn Default, andere Defaults deaktivieren
    if (isDefault) {
      await this.prismaService.client.dashboard.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const dashboard = await this.prismaService.client.dashboard.create({
      data: {
        tenantId,
        name,
        layout: layout as any, // Prisma erwartet Json type
        config: {} as DashboardConfig, // Legacy: leeres config für Kompatibilität
        isDefault,
      },
    });

    // Cache invalidieren (alle Dashboard-Keys für diesen Tenant)
    await this.cache.deletePattern(`dashboard:${tenantId}:*`);

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
      layout?: DashboardLayout;
      isDefault?: boolean;
    },
  ): Promise<Dashboard> {
    // Wenn Default, andere Defaults deaktivieren
    if (updates.isDefault) {
      await this.prismaService.client.dashboard.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const dashboard = await this.prismaService.client.dashboard.update({
      where: {
        id: dashboardId,
        tenantId,
      },
      data: {
        ...updates,
        layout: updates.layout as any, // Prisma erwartet Json type
        config: (updates.layout as DashboardConfig) || {}, // Legacy: config als Fallback
      },
    });

    // Cache invalidieren
    await this.cache.deletePattern(`dashboard:${tenantId}:*`);

    return dashboard;
  }

  /**
   * Dashboard löschen
   */
  async deleteDashboard(tenantId: string, dashboardId: string): Promise<void> {
    await this.prismaService.client.dashboard.delete({
      where: {
        id: dashboardId,
        tenantId,
      },
    });

    // Cache invalidieren
    await this.cache.deletePattern(`dashboard:${tenantId}:*`);
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
    const dashboards = await this.prismaService.client.dashboard.findMany({
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
  private async createDefaultDashboard(tenantId: string): Promise<Dashboard> {
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

    return await this.prismaService.client.dashboard.create({
      data: {
        tenantId,
        name: 'Default Dashboard',
        layout: defaultLayout as any,
        isDefault: true,
      },
    });
  }
}
