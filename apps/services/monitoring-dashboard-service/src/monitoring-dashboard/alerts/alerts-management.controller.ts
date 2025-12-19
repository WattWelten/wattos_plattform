import { Controller, Get, Put, Param, Query } from '@nestjs/common';
import { AlertsManagementService } from './alerts-management.service';

/**
 * Alerts Management Controller
 * 
 * REST API für Alert-Management
 */
@Controller('dashboard/alerts')
export class AlertsManagementController {
  constructor(private readonly alertsManagementService: AlertsManagementService) {}

  /**
   * Alerts abrufen
   */
  @Get()
  async getAlerts(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('service') service?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.alertsManagementService.getAlerts(
      tenantId,
      status,
      severity,
      service,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  /**
   * Alert-Regeln abrufen
   */
  @Get('rules')
  async getAlertRules(
    @Query('tenantId') tenantId?: string,
    @Query('enabled') enabled?: string,
  ) {
    return await this.alertsManagementService.getAlertRules(
      tenantId,
      enabled === 'true' ? true : enabled === 'false' ? false : undefined,
    );
  }

  /**
   * Alert bestätigen
   */
  @Put(':alertId/acknowledge')
  async acknowledgeAlert(@Param('alertId') alertId: string) {
    return await this.alertsManagementService.acknowledgeAlert(alertId);
  }

  /**
   * Alert auflösen
   */
  @Put(':alertId/resolve')
  async resolveAlert(@Param('alertId') alertId: string) {
    return await this.alertsManagementService.resolveAlert(alertId);
  }
}

