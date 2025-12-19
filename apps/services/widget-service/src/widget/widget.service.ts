import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { EmbeddingCodeGeneratorService } from './embedding-code-generator.service';

/**
 * Widget Service
 * 
 * Verwaltet Widget-Konfigurationen und Embedding-Codes
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
   * Widget-Konfiguration abrufen
   */
  async getWidgetConfig(tenantId: string, widgetId?: string): Promise<any> {
    // MVP: Placeholder - in Production: Widget-Konfiguration aus DB
    return {
      tenantId,
      widgetId: widgetId || 'default',
      position: 'bottom-right',
      size: { width: 400, height: 600 },
      theme: 'light',
      avatar: null,
      enabled: true,
    };
  }

  /**
   * Widget-Konfiguration aktualisieren
   */
  async updateWidgetConfig(
    tenantId: string,
    widgetId: string,
    config: any,
  ): Promise<any> {
    // MVP: Placeholder - in Production: Widget-Konfiguration in DB speichern
    this.logger.log(`Updating widget config: ${widgetId}`, { tenantId, config });
    return { ...config, tenantId, widgetId };
  }

  /**
   * Embedding-Code generieren
   */
  async generateEmbeddingCode(tenantId: string, widgetId?: string): Promise<string> {
    const config = await this.getWidgetConfig(tenantId, widgetId);
    return this.codeGenerator.generateCode(config);
  }
}

