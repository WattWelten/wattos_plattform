import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';

/**
 * Dashboard Controller
 * 
 * REST API für Dashboard-Management
 */
@Controller('dashboards')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Dashboard abrufen
   */
  @Get(':dashboardId?')
  async getDashboard(
    @Param('dashboardId') dashboardId: string | undefined,
    @Query('tenantId') tenantId: string,
  ) {
    return await this.dashboardService.getDashboard(tenantId, dashboardId);
  }

  /**
   * Alle Dashboards auflisten
   */
  @Get()
  async listDashboards(@Query('tenantId') tenantId: string) {
    return await this.dashboardService.listDashboards(tenantId);
  }

  /**
   * Dashboard erstellen
   */
  @Post()
  async createDashboard(
    @Query('tenantId') tenantId: string,
    @Body() createDto: CreateDashboardDto,
  ) {
    return await this.dashboardService.createDashboard(
      tenantId,
      createDto.name,
      createDto.layout,
      createDto.isDefault,
    );
  }

  /**
   * Dashboard aktualisieren
   */
  @Put(':dashboardId')
  async updateDashboard(
    @Param('dashboardId') dashboardId: string,
    @Query('tenantId') tenantId: string,
    @Body() updateDto: UpdateDashboardDto,
  ) {
    return await this.dashboardService.updateDashboard(
      tenantId,
      dashboardId,
      updateDto,
    );
  }

  /**
   * Dashboard löschen
   */
  @Delete(':dashboardId')
  async deleteDashboard(
    @Param('dashboardId') dashboardId: string,
    @Query('tenantId') tenantId: string,
  ) {
    await this.dashboardService.deleteDashboard(tenantId, dashboardId);
    return { success: true };
  }
}

