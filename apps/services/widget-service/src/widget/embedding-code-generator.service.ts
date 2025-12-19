import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Embedding Code Generator Service
 * 
 * Generiert Embedding-Code für Widget-Integration
 */
@Injectable()
export class EmbeddingCodeGeneratorService {
  private readonly logger = new Logger(EmbeddingCodeGeneratorService.name);
  private readonly widgetBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.widgetBaseUrl =
      this.configService.get<string>('WIDGET_BASE_URL') ||
      'https://widget.wattweiser.com';
  }

  /**
   * Embedding-Code generieren
   */
  generateCode(config: any): string {
    const widgetId = config.widgetId || 'default';
    const tenantId = config.tenantId;
    const position = config.position || 'bottom-right';
    const theme = config.theme || 'light';

    // Ein-Zeilen-Integration
    return `<script src="${this.widgetBaseUrl}/widget.js" data-tenant-id="${tenantId}" data-widget-id="${widgetId}" data-position="${position}" data-theme="${theme}"></script>`;
  }

  /**
   * iframe-Code generieren
   */
  generateIframeCode(config: any): string {
    const widgetId = config.widgetId || 'default';
    const tenantId = config.tenantId;
    const width = config.size?.width || 400;
    const height = config.size?.height || 600;

    return `<iframe src="${this.widgetBaseUrl}/widget/${tenantId}/${widgetId}" width="${width}" height="${height}" frameborder="0"></iframe>`;
  }
}


