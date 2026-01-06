import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { CacheService } from '@wattweiser/shared';

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
   * Widget erstellen
   */
  async createWidget(
    tenantId: string,
    data: {
      dashboardId?: string;
      characterId?: string;
      type: string;
      name: string;
      config: any;
      position: any;
    },
  ): Promise<any> {
    const widget = await this.prismaService.client.widget.create({
      data: {
        tenantId,
        dashboardId: data.dashboardId,
        characterId: data.characterId,
        type: data.type,
        name: data.name,
        config: data.config as any,
        position: data.position as any,
      },
      include: {
        dashboard: true,
        character: true,
      },
    });

    // Cache invalidieren
    if (data.dashboardId) {
      await this.cache.delete(`dashboard:${tenantId}:${data.dashboardId}`);
    }
    await this.cache.delete(`widgets:${tenantId}:*`);

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
      config?: any;
      position?: any;
      dashboardId?: string;
    },
  ): Promise<any> {
    const widget = await this.prismaService.client.widget.update({
      where: {
        id: widgetId,
        tenantId,
      },
      data: {
        ...updates,
        config: updates.config as any,
        position: updates.position as any,
      },
      include: {
        dashboard: true,
        character: true,
      },
    });

    // Cache invalidieren
    if (widget.dashboardId) {
      await this.cache.delete(`dashboard:${tenantId}:${widget.dashboardId}`);
    }
    await this.cache.delete(`widget:${tenantId}:${widgetId}`);
    await this.cache.delete(`widgets:${tenantId}:*`);

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
      await this.cache.delete(`dashboard:${tenantId}:${widget.dashboardId}`);
    }
    await this.cache.delete(`widget:${tenantId}:${widgetId}`);
    await this.cache.delete(`widgets:${tenantId}:*`);
  }

  /**
   * Widget abrufen
   */
  async getWidget(tenantId: string, widgetId: string): Promise<any> {
    const cacheKey = `widget:${tenantId}:${widgetId}`;
    
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
  async getWidgetsByDashboard(tenantId: string, dashboardId: string): Promise<any[]> {
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
  async getWidgetsByCharacter(tenantId: string, characterId: string): Promise<any[]> {
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
  async listWidgets(tenantId: string, filters?: { type?: string; dashboardId?: string }): Promise<any[]> {
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

