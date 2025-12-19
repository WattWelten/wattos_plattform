import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { EmbeddingCodeGeneratorService } from './embedding-code-generator.service';
import { CreateWidgetConfigDto } from './dto/create-widget-config.dto';
import { UpdateWidgetConfigDto } from './dto/update-widget-config.dto';

/**
 * Widget Service
 * 
 * Verwaltet Widget-Konfigurationen, Embedding-Codes, Analytics und A/B-Testing
 */
@Injectable()
export class WidgetService {
  private readonly logger = new Logger(WidgetService.name);
  private readonly prisma: PrismaClient;

  constructor(
    private readonly codeGenerator: EmbeddingCodeGeneratorService,
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Widget erstellen
   */
  async createWidget(
    tenantId: string,
    createDto: CreateWidgetConfigDto,
  ): Promise<any> {
    this.logger.log(`Creating widget for tenant: ${tenantId}`, { name: createDto.name });

    const widget = await this.prisma.widget.create({
      data: {
        tenantId,
        characterId: createDto.characterId || null,
        name: createDto.name,
        type: createDto.type,
        mode: createDto.mode || 'iframe',
        config: {
          position: createDto.position || 'bottom-right',
          size: createDto.size || { width: 400, height: 600 },
          theme: createDto.theme || 'light',
          avatar: createDto.avatar || null,
          ...createDto.config,
        },
        abTestVariant: createDto.abTestVariant || null,
        analyticsEnabled: createDto.analyticsEnabled !== false,
        isActive: true,
      },
      include: {
        character: true,
      },
    });

    // Embedding-Code generieren und speichern
    const embeddingCode = this.codeGenerator.generateCode({
      tenantId,
      widgetId: widget.id,
      ...widget.config as any,
    });

    await this.prisma.widget.update({
      where: { id: widget.id },
      data: { embeddingCode },
    });

    return this.mapToResponse(widget);
  }

  /**
   * Widget abrufen
   */
  async getWidget(tenantId: string, widgetId: string): Promise<any> {
    const widget = await this.prisma.widget.findFirst({
      where: {
        id: widgetId,
        tenantId,
      },
      include: {
        character: true,
      },
    });

    if (!widget) {
      throw new NotFoundException(`Widget not found: ${widgetId}`);
    }

    return this.mapToResponse(widget);
  }

  /**
   * Widgets auflisten
   */
  async listWidgets(
    tenantId: string,
    options?: {
      characterId?: string;
      isActive?: boolean;
      type?: string;
    },
  ): Promise<any[]> {
    const widgets = await this.prisma.widget.findMany({
      where: {
        tenantId,
        ...(options?.characterId && { characterId: options.characterId }),
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
        ...(options?.type && { type: options.type }),
      },
      include: {
        character: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return widgets.map((w) => this.mapToResponse(w));
  }

  /**
   * Widget aktualisieren
   */
  async updateWidget(
    tenantId: string,
    widgetId: string,
    updateDto: UpdateWidgetConfigDto,
  ): Promise<any> {
    const existingWidget = await this.prisma.widget.findFirst({
      where: {
        id: widgetId,
        tenantId,
      },
    });

    if (!existingWidget) {
      throw new NotFoundException(`Widget not found: ${widgetId}`);
    }

    const config = existingWidget.config as any;
    const updatedConfig = {
      ...config,
      ...(updateDto.position && { position: updateDto.position }),
      ...(updateDto.size && { size: updateDto.size }),
      ...(updateDto.theme && { theme: updateDto.theme }),
      ...(updateDto.avatar && { avatar: updateDto.avatar }),
      ...(updateDto.config && updateDto.config),
    };

    const widget = await this.prisma.widget.update({
      where: { id: widgetId },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.type && { type: updateDto.type }),
        ...(updateDto.mode && { mode: updateDto.mode }),
        ...(updateDto.characterId !== undefined && { characterId: updateDto.characterId }),
        ...(updateDto.abTestVariant !== undefined && { abTestVariant: updateDto.abTestVariant }),
        ...(updateDto.analyticsEnabled !== undefined && { analyticsEnabled: updateDto.analyticsEnabled }),
        ...(updateDto.isActive !== undefined && { isActive: updateDto.isActive }),
        config: updatedConfig,
      },
      include: {
        character: true,
      },
    });

    // Embedding-Code neu generieren
    const embeddingCode = this.codeGenerator.generateCode({
      tenantId,
      widgetId: widget.id,
      ...widget.config as any,
    });

    await this.prisma.widget.update({
      where: { id: widget.id },
      data: { embeddingCode },
    });

    return this.mapToResponse({ ...widget, embeddingCode });
  }

  /**
   * Widget löschen
   */
  async deleteWidget(tenantId: string, widgetId: string): Promise<void> {
    const widget = await this.prisma.widget.findFirst({
      where: {
        id: widgetId,
        tenantId,
      },
    });

    if (!widget) {
      throw new NotFoundException(`Widget not found: ${widgetId}`);
    }

    await this.prisma.widget.delete({
      where: { id: widgetId },
    });

    this.logger.log(`Widget deleted: ${widgetId}`);
  }

  /**
   * Embedding-Code generieren
   */
  async generateEmbeddingCode(tenantId: string, widgetId: string): Promise<string> {
    const widget = await this.getWidget(tenantId, widgetId);
    
    if (widget.embeddingCode) {
      return widget.embeddingCode;
    }

    const code = this.codeGenerator.generateCode({
      tenantId,
      widgetId: widget.id,
      ...widget.config,
    });

    // Code in DB speichern
    await this.prisma.widget.update({
      where: { id: widgetId },
      data: { embeddingCode: code },
    });

    return code;
  }

  /**
   * Analytics-Event tracken
   */
  async trackEvent(
    widgetId: string,
    eventType: string,
    eventData?: Record<string, any>,
    sessionId?: string,
    userId?: string,
  ): Promise<void> {
    await this.prisma.widgetAnalytics.create({
      data: {
        widgetId,
        eventType,
        eventData: eventData || {},
        sessionId: sessionId || null,
        userId: userId || null,
      },
    });

    this.logger.debug(`Analytics event tracked: ${eventType}`, { widgetId, sessionId });
  }

  /**
   * Analytics abrufen
   */
  async getAnalytics(
    tenantId: string,
    widgetId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      eventType?: string;
    },
  ): Promise<any> {
    const widget = await this.prisma.widget.findFirst({
      where: {
        id: widgetId,
        tenantId,
      },
    });

    if (!widget) {
      throw new NotFoundException(`Widget not found: ${widgetId}`);
    }

    const analytics = await this.prisma.widgetAnalytics.findMany({
      where: {
        widgetId,
        ...(options?.startDate && { timestamp: { gte: options.startDate } }),
        ...(options?.endDate && { timestamp: { lte: options.endDate } }),
        ...(options?.eventType && { eventType: options.eventType }),
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Analytics aggregieren
    const aggregated = {
      totalEvents: analytics.length,
      eventsByType: analytics.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      uniqueSessions: new Set(analytics.map((a) => a.sessionId).filter(Boolean)).size,
      uniqueUsers: new Set(analytics.map((a) => a.userId).filter(Boolean)).size,
      events: analytics.map((a) => ({
        eventType: a.eventType,
        eventData: a.eventData,
        sessionId: a.sessionId,
        userId: a.userId,
        timestamp: a.timestamp,
      })),
    };

    return aggregated;
  }

  /**
   * A/B-Test-Varianten abrufen
   */
  async getABTestVariants(tenantId: string, baseWidgetId: string): Promise<any[]> {
    const baseWidget = await this.prisma.widget.findFirst({
      where: {
        id: baseWidgetId,
        tenantId,
      },
    });

    if (!baseWidget) {
      throw new NotFoundException(`Widget not found: ${baseWidgetId}`);
    }

    // Alle Varianten mit gleichem Namen (aber unterschiedlicher abTestVariant)
    const variants = await this.prisma.widget.findMany({
      where: {
        tenantId,
        name: baseWidget.name,
        id: { not: baseWidgetId },
        abTestVariant: { not: null },
      },
      include: {
        character: true,
      },
    });

    return [this.mapToResponse(baseWidget), ...variants.map((v) => this.mapToResponse(v))];
  }

  /**
   * Widget zu Response mappen
   */
  private mapToResponse(widget: any): any {
    return {
      id: widget.id,
      tenantId: widget.tenantId,
      characterId: widget.characterId,
      name: widget.name,
      type: widget.type,
      mode: widget.mode,
      config: widget.config,
      abTestVariant: widget.abTestVariant,
      analyticsEnabled: widget.analyticsEnabled,
      isActive: widget.isActive,
      embeddingCode: widget.embeddingCode,
      character: widget.character ? {
        id: widget.character.id,
        name: widget.character.name,
        role: widget.character.role,
      } : null,
      createdAt: widget.createdAt,
      updatedAt: widget.updatedAt,
    };
  }
}

