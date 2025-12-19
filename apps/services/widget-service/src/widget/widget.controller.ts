import { Controller, Get, Post, Put, Query, Body, Param } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { CreateWidgetConfigDto } from './dto/create-widget-config.dto';
import { UpdateWidgetConfigDto } from './dto/update-widget-config.dto';

/**
 * Widget Controller
 * 
 * REST API für Widget-Management
 */
@Controller('widgets')
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  /**
   * Widget-Konfiguration abrufen
   */
  @Get(':widgetId?')
  async getWidgetConfig(
    @Param('widgetId') widgetId: string | undefined,
    @Query('tenantId') tenantId: string,
  ) {
    return await this.widgetService.getWidgetConfig(tenantId, widgetId);
  }

  /**
   * Widget-Konfiguration aktualisieren
   */
  @Put(':widgetId')
  async updateWidgetConfig(
    @Param('widgetId') widgetId: string,
    @Query('tenantId') tenantId: string,
    @Body() updateDto: UpdateWidgetConfigDto,
  ) {
    return await this.widgetService.updateWidgetConfig(
      tenantId,
      widgetId,
      updateDto,
    );
  }

  /**
   * Embedding-Code generieren
   */
  @Get(':widgetId/embedding-code')
  async getEmbeddingCode(
    @Param('widgetId') widgetId: string,
    @Query('tenantId') tenantId: string,
  ) {
    const code = await this.widgetService.generateEmbeddingCode(tenantId, widgetId);
    return { code };
  }
}

