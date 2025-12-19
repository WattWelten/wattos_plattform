import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertRuleService } from './alert-rule.service';

/**
 * Alerts Controller
 * 
 * REST API für Alert-Management
 */
@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly alertRuleService: AlertRuleService,
  ) {}

  /**
   * Alert-Regel erstellen
   */
  @Post('rules')
  async createAlertRule(
    @Body() body: {
      tenantId?: string;
      name: string;
      description?: string;
      metric: string;
      threshold: number;
      operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
      duration: number;
      severity: 'info' | 'warning' | 'error' | 'critical';
      actions?: string[];
      recipients?: string[];
    },
  ) {
    return await this.alertRuleService.createAlertRule(
      body.tenantId,
      body.name,
      body.metric,
      body.threshold,
      body.operator,
      body.duration,
      body.severity,
      body.description,
      body.actions,
      body.recipients,
    );
  }

  /**
   * Alert-Regeln auflisten
   */
  @Get('rules')
  async listAlertRules(
    @Query('tenantId') tenantId?: string,
    @Query('enabled') enabled?: string,
  ) {
    return await this.alertRuleService.listAlertRules(
      tenantId,
      enabled === 'true' ? true : enabled === 'false' ? false : undefined,
    );
  }

  /**
   * Alert-Regel aktualisieren
   */
  @Put('rules/:ruleId')
  async updateAlertRule(
    @Param('ruleId') ruleId: string,
    @Body() body: {
      name?: string;
      description?: string;
      threshold?: number;
      operator?: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
      duration?: number;
      severity?: 'info' | 'warning' | 'error' | 'critical';
      enabled?: boolean;
      actions?: string[];
      recipients?: string[];
    },
  ) {
    return await this.alertRuleService.updateAlertRule(ruleId, body);
  }

  /**
   * Alert-Regel löschen
   */
  @Post('rules/:ruleId/delete')
  async deleteAlertRule(@Param('ruleId') ruleId: string) {
    await this.alertRuleService.deleteAlertRule(ruleId);
    return { success: true };
  }

  /**
   * Alerts auflisten
   */
  @Get()
  async listAlerts(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('service') service?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.alertsService.listAlerts(
      tenantId,
      status,
      severity,
      service,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  /**
   * Alert bestätigen
   */
  @Put(':alertId/acknowledge')
  async acknowledgeAlert(@Param('alertId') alertId: string) {
    return await this.alertsService.acknowledgeAlert(alertId);
  }

  /**
   * Alert auflösen
   */
  @Put(':alertId/resolve')
  async resolveAlert(@Param('alertId') alertId: string) {
    return await this.alertsService.resolveAlert(alertId);
  }
}

