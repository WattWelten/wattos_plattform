import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { CacheService } from '@wattweiser/shared';
import { WidgetPosition, WidgetConfig, Widget } from '../common/interfaces/widget.interface';

/**
 * Widget Service
 * 
 * Verwaltet Widget-Konfigurationen für Dashboards
 */
@Injectable()
export class WidgetService {
  private readonly logger = new Logger(WidgetService.name);
  private readonly cacheTTL = 300; // 5 Minuten

  constructor(
    private readonly prismaService: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Erstellt ein neues Widget für einen Tenant
   * 
   * @param tenantId - UUID des Tenants
   * @param data - Widget-Daten
   * @param data.dashboardId - Optional: UUID des Dashboards, dem das Widget zugeordnet werden soll
   * @param data.characterId - Optional: UUID des Characters, dem das Widget zugeordnet werden soll
   * @param data.type - Widget-Typ (z.B. 'kpi', 'analytics', 'metrics')
   * @param data.name - Widget-Name
   * @param data.config - Optional: Widget-Konfiguration
   * @param data.position - Optional: Widget-Position auf dem Dashboard
   * @returns Promise<Widget> - Das erstellte Widget
   * 
   * @example
   * ```typescript
   * const widget = await widgetService.createWidget('tenant-uuid', {
   *   type: 'kpi',
   *   name: 'KPI Overview',
   *   config: { range: '7d' },
   *   position: { x: 0, y: 0, width: 4, height: 2 }
   * });
   * ```
   * 
   * @remarks
   * - Invalidiert automatisch den Cache für das zugehörige Dashboard und alle Widgets des Tenants
   */
  async createWidget(
    tenantId: string,
    data: {
      dashboardId?: string;
      characterId?: string;
      type: string;
      name: string;
      config?: WidgetConfig;
      position?: WidgetPosition;
    },
  ): Promise<Widget> {
    const widget = await this.prismaService.client.widget.create({
      data: {
        tenantId,
        dashboardId: data.dashboardId,
        characterId: data.characterId,
        type: data.type,
        name: data.name,
        config: (data.config || {}) as any, // Prisma erwartet Json type
        position: (data.position || {}) as any, // Prisma erwartet Json type
      },
      include: {
        dashboard: true,
        character: true,
      },
    });

    // Cache invalidieren
    if (data.dashboardId) {
      await this.cache.deletePattern(`dashboard:${tenantId}:*`);
    }
    await this.cache.deletePattern(`widgets:${tenantId}:*`);

    return widget;
  }

  /**
   * Widget aktualisieren
   */
  async updateWidget(
    tenantId: string,
    widgetId: string,
    updates: {
      name?: string;
      config?: WidgetConfig;
      position?: WidgetPosition;
      dashboardId?: string;
    },
  ): Promise<Widget> {
    const widget = await this.prismaService.client.widget.update({
      where: {
        id: widgetId,
        tenantId,
      },
      data: {
        ...updates,
        config: (updates.config || {}) as any, // Prisma erwartet Json type
        position: (updates.position || {}) as any, // Prisma erwartet Json type
      },
      include: {
        dashboard: true,
        character: true,
      },
    });

    // Cache invalidieren
    if (widget.dashboardId) {
      await this.cache.deletePattern(`dashboard:${tenantId}:*`);
    }
    await this.cache.deletePattern(`widgets:${tenantId}:*`);

    return widget;
  }

  /**
   * Widget löschen
   */
  async deleteWidget(tenantId: string, widgetId: string): Promise<void> {
    const widget = await this.prismaService.client.widget.findUnique({
      where: {
        id: widgetId,
        tenantId,
      },
    });

    if (!widget) {
      throw new Error(`Widget not found: ${widgetId}`);
    }

    await this.prismaService.client.widget.delete({
      where: {
        id: widgetId,
        tenantId,
      },
    });

    // Cache invalidieren
    if (widget.dashboardId) {
      await this.cache.deletePattern(`dashboard:${tenantId}:*`);
    }
    await this.cache.deletePattern(`widgets:${tenantId}:*`);
  }

  /**
   * Widget abrufen
   */
  async getWidget(tenantId: string, widgetId: string): Promise<Widget> {
    const cacheKey = `widgets:${tenantId}:${widgetId}`;
    
    // Cache-Check
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Widget loaded from cache: ${cacheKey}`);
      return cached;
    }

    const widget = await this.prismaService.client.widget.findUnique({
      where: {
        id: widgetId,
        tenantId,
      },
      include: {
        dashboard: true,
        character: true,
      },
    });

    if (!widget) {
      throw new Error(`Widget not found: ${widgetId}`);
    }

    // Cache speichern
    await this.cache.set(cacheKey, widget, this.cacheTTL);

    return widget;
  }

  /**
   * Widgets für Dashboard abrufen
   */
  async getWidgetsByDashboard(tenantId: string, dashboardId: string): Promise<Widget[]> {
    const cacheKey = `widgets:${tenantId}:${dashboardId}`;
    
    // Cache-Check
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Widgets loaded from cache: ${cacheKey}`);
      return cached;
    }

    const widgets = await this.prismaService.client.widget.findMany({
      where: {
        tenantId,
        dashboardId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Cache speichern
    await this.cache.set(cacheKey, widgets, this.cacheTTL);

    return widgets;
  }

  /**
   * Widgets für Character abrufen
   */
  async getWidgetsByCharacter(tenantId: string, characterId: string): Promise<Widget[]> {
    const cacheKey = `widgets:${tenantId}:character:${characterId}`;
    
    // Cache-Check
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Widgets loaded from cache: ${cacheKey}`);
      return cached;
    }

    const widgets = await this.prismaService.client.widget.findMany({
      where: {
        tenantId,
        characterId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Cache speichern
    await this.cache.set(cacheKey, widgets, this.cacheTTL);

    return widgets;
  }

  /**
   * Alle Widgets für Tenant auflisten
   */
  async listWidgets(tenantId: string, filters?: { type?: string; dashboardId?: string }): Promise<Widget[]> {
    const widgets = await this.prismaService.client.widget.findMany({
      where: {
        tenantId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.dashboardId && { dashboardId: filters.dashboardId }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return widgets;
  }
}

