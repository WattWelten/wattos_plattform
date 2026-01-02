import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':tenantId')
  async getDashboard(
    @Param('tenantId') tenantId: string,
    @Query('dashboardId') dashboardId?: string,
  ) {
    return await this.dashboardService.getDashboard(tenantId, dashboardId);
  }

  @Post(':tenantId')
  async createDashboard(
    @Param('tenantId') tenantId: string,
    @Body() body: { name: string; layout: any; isDefault?: boolean },
  ) {
    return await this.dashboardService.createDashboard(
      tenantId,
      body.name,
      body.layout,
      body.isDefault || false,
    );
  }

  @Put(':tenantId/:dashboardId')
  async updateDashboard(
    @Param('tenantId') tenantId: string,
    @Param('dashboardId') dashboardId: string,
    @Body() body: { name?: string; layout?: any; isDefault?: boolean },
  ) {
    return await this.dashboardService.updateDashboard(tenantId, dashboardId, body);
  }

  @Delete(':tenantId/:dashboardId')
  async deleteDashboard(
    @Param('tenantId') tenantId: string,
    @Param('dashboardId') dashboardId: string,
  ) {
    return await this.dashboardService.deleteDashboard(tenantId, dashboardId);
  }
}

