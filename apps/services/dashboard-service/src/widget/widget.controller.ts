import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { WidgetService } from './widget.service';

@Controller('widgets')
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  @Post(':tenantId')
  async createWidget(
    @Param('tenantId') tenantId: string,
    @Body() body: {
      dashboardId?: string;
      characterId?: string;
      type: string;
      name: string;
      config: any;
      position: any;
    },
  ) {
    return await this.widgetService.createWidget(tenantId, body);
  }

  @Get(':tenantId/:widgetId')
  async getWidget(
    @Param('tenantId') tenantId: string,
    @Param('widgetId') widgetId: string,
  ) {
    return await this.widgetService.getWidget(tenantId, widgetId);
  }

  @Put(':tenantId/:widgetId')
  async updateWidget(
    @Param('tenantId') tenantId: string,
    @Param('widgetId') widgetId: string,
    @Body() body: {
      name?: string;
      config?: any;
      position?: any;
      dashboardId?: string;
    },
  ) {
    return await this.widgetService.updateWidget(tenantId, widgetId, body);
  }

  @Delete(':tenantId/:widgetId')
  async deleteWidget(
    @Param('tenantId') tenantId: string,
    @Param('widgetId') widgetId: string,
  ) {
    return await this.widgetService.deleteWidget(tenantId, widgetId);
  }

  @Get(':tenantId')
  async listWidgets(
    @Param('tenantId') tenantId: string,
    @Query('type') type?: string,
    @Query('dashboardId') dashboardId?: string,
  ) {
    return await this.widgetService.listWidgets(tenantId, { type, dashboardId });
  }

  @Get(':tenantId/dashboard/:dashboardId')
  async getWidgetsByDashboard(
    @Param('tenantId') tenantId: string,
    @Param('dashboardId') dashboardId: string,
  ) {
    return await this.widgetService.getWidgetsByDashboard(tenantId, dashboardId);
  }

  @Get(':tenantId/character/:characterId')
  async getWidgetsByCharacter(
    @Param('tenantId') tenantId: string,
    @Param('characterId') characterId: string,
  ) {
    return await this.widgetService.getWidgetsByCharacter(tenantId, characterId);
  }
}

