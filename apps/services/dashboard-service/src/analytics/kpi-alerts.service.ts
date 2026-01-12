/**
 * KPI Alerts Service
 * 
 * Verwaltet Alerts für kritische KPI-Schwellenwerte
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KpiMetricsService } from './kpi-metrics.service';
import { PrismaService } from '@wattweiser/db';

@Injectable()
export class KpiAlertsService implements OnModuleInit {
  private readonly logger = new Logger(KpiAlertsService.name);

  constructor(
    private readonly kpiMetricsService: KpiMetricsService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log('KPI Alerts Service initialized');
  }

  /**
   * Prüfe Alerts für alle Tenants (täglich um 9:00)
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkAllTenantAlerts() {
    this.logger.log('Checking alerts for all tenants...');

    try {
      const tenants = await this.prisma.client.tenant.findMany({
        select: { id: true, name: true },
      });

      for (const tenant of tenants) {
        const alerts = await this.kpiMetricsService.checkAlerts(tenant.id);

        if (alerts.length > 0) {
          this.logger.warn(
            `Alerts for tenant ${tenant.name} (${tenant.id}): ${alerts.join(', ')}`,
          );

          // Hier würde die Alert-Benachrichtigung erfolgen
          // z.B. Email, Slack, PagerDuty, etc.
        }
      }

      this.logger.log(`Checked alerts for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to check alerts: ${error}`);
    }
  }

  /**
   * Prüft Alerts für einen spezifischen Tenant
   * 
   * @param tenantId - UUID des Tenants
   * @returns Promise<{ tenantId: string; tenantName: string; alerts: string[]; timestamp: Date }> - Alert-Ergebnis mit Tenant-Info
   * 
   * @example
   * ```typescript
   * const result = await kpiAlertsService.checkTenantAlerts('tenant-uuid');
   * console.log(result.alerts); // ['CSAT kritisch: 2.5/5.0']
   * ```
   * 
   * @throws {Error} Wenn Tenant nicht gefunden wird
   * 
   * @remarks
   * - Wird von Controllern verwendet für manuelle Alert-Prüfung
   * - Automatische Prüfung erfolgt täglich um 9:00 via Cron-Job
   */
  async checkTenantAlerts(tenantId: string) {
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const alerts = await this.kpiMetricsService.checkAlerts(tenantId);

    return {
      tenantId,
      tenantName: tenant.name,
      alerts,
      timestamp: new Date(),
    };
  }
}
