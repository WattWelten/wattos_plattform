import { Controller, Get, Post, Put, Delete, Query, Body, Param, Headers } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { CreateWidgetConfigDto } from './dto/create-widget-config.dto';
import { UpdateWidgetConfigDto } from './dto/update-widget-config.dto';

/**
 * Widget Controller
 * 
 * REST API für Widget-Management, Analytics und A/B-Testing
 */
@Controller('widgets')
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  /**
   * Widget erstellen
   */
  @Post()
  async createWidget(
    @Query('tenantId') tenantId: string,
    @Body() createDto: CreateWidgetConfigDto,
  ) {
    return await this.widgetService.createWidget(tenantId, createDto);
  }

  /**
   * Widgets auflisten
   */
  @Get()
  async listWidgets(
    @Query('tenantId') tenantId: string,
    @Query('characterId') characterId?: string,
    @Query('isActive') isActive?: string,
    @Query('type') type?: string,
  ) {
    return await this.widgetService.listWidgets(tenantId, {
      characterId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      type,
    });
  }

  /**
   * Widget abrufen
   */
  @Get(':widgetId')
  async getWidget(
    @Param('widgetId') widgetId: string,
    @Query('tenantId') tenantId: string,
  ) {
    return await this.widgetService.getWidget(tenantId, widgetId);
  }

  /**
   * Widget aktualisieren
   */
  @Put(':widgetId')
  async updateWidget(
    @Param('widgetId') widgetId: string,
    @Query('tenantId') tenantId: string,
    @Body() updateDto: UpdateWidgetConfigDto,
  ) {
    return await this.widgetService.updateWidget(tenantId, widgetId, updateDto);
  }

  /**
   * Widget löschen
   */
  @Delete(':widgetId')
  async deleteWidget(
    @Param('widgetId') widgetId: string,
    @Query('tenantId') tenantId: string,
  ) {
    await this.widgetService.deleteWidget(tenantId, widgetId);
    return { success: true };
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

  /**
   * Analytics-Event tracken
   */
  @Post(':widgetId/analytics/events')
  async trackEvent(
    @Param('widgetId') widgetId: string,
    @Body() body: {
      eventType: string;
      eventData?: Record<string, any>;
      sessionId?: string;
      userId?: string;
    },
    @Headers('x-session-id') sessionId?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    await this.widgetService.trackEvent(
      widgetId,
      body.eventType,
      body.eventData,
      body.sessionId || sessionId,
      body.userId || userId,
    );
    return { success: true };
  }

  /**
   * Analytics abrufen
   */
  @Get(':widgetId/analytics')
  async getAnalytics(
    @Param('widgetId') widgetId: string,
    @Query('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('eventType') eventType?: string,
  ) {
    return await this.widgetService.getAnalytics(tenantId, widgetId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      eventType,
    });
  }

  /**
   * A/B-Test-Varianten abrufen
   */
  @Get(':widgetId/ab-test-variants')
  async getABTestVariants(
    @Param('widgetId') widgetId: string,
    @Query('tenantId') tenantId: string,
  ) {
    return await this.widgetService.getABTestVariants(tenantId, widgetId);
  }
}

