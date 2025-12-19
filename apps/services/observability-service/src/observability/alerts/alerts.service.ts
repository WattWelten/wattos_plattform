import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Alerts Service
 * 
 * Alert-Management mit Threshold-basierten Regeln
 */
@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private readonly prisma: PrismaClient;

  constructor(private readonly metricsService: MetricsService) {
    this.prisma = new PrismaClient();
  }

  /**
   * Cron-Job: Alert-Regeln prüfen (alle 30 Sekunden)
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkAlertRules(): Promise<void> {
    const rules = await this.prisma.alertRule.findMany({
      where: { enabled: true },
    });

    for (const rule of rules) {
      await this.checkAlertRule(rule);
    }
  }

  /**
   * Einzelne Alert-Regel prüfen
   */
  private async checkAlertRule(rule: any): Promise<void> {
    try {
      // Metrik-Wert abrufen (vereinfacht - in Production: aus Prometheus/Metrics-Service)
      const metricValue = await this.getMetricValue(rule.metric, rule.tenantId || undefined);

      if (metricValue === null) {
        return; // Metrik nicht verfügbar
      }

      // Prüfen, ob Schwellenwert überschritten
      const isViolated = this.checkThreshold(metricValue, rule.threshold, rule.operator);

      if (isViolated) {
        // Prüfen, ob bereits ein offener Alert existiert
        const existingAlert = await this.prisma.alert.findFirst({
          where: {
            alertRuleId: rule.id,
            status: 'open',
          },
        });

        if (!existingAlert) {
          // Neuen Alert erstellen
          await this.createAlert(rule, metricValue);
        }
      } else {
        // Schwellenwert nicht mehr überschritten - offene Alerts schließen
        await this.resolveAlerts(rule.id);
      }
    } catch (error) {
      this.logger.error(`Failed to check alert rule ${rule.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Alert erstellen
   */
  async createAlert(rule: any, metricValue: number): Promise<any> {
    const message = this.generateAlertMessage(rule, metricValue);

    const alert = await this.prisma.alert.create({
      data: {
        tenantId: rule.tenantId || null,
        alertRuleId: rule.id,
        service: 'unknown', // Wird aus Metrik abgeleitet
        metric: rule.metric,
        value: metricValue,
        threshold: rule.threshold,
        severity: rule.severity,
        status: 'open',
        message,
        metadata: {},
      },
    });

    // Alert-Aktionen ausführen
    await this.executeAlertActions(alert, rule);

    this.logger.warn(`Alert created: ${alert.id}`, { rule: rule.name, metricValue, threshold: rule.threshold });
    return alert;
  }

  /**
   * Alerts auflisten
   */
  async listAlerts(
    tenantId?: string,
    status?: string,
    severity?: string,
    service?: string,
    limit: number = 100,
  ): Promise<any[]> {
    const alerts = await this.prisma.alert.findMany({
      where: {
        ...(tenantId && { tenantId }),
        ...(status && { status }),
        ...(severity && { severity }),
        ...(service && { service }),
      },
      include: {
        alertRule: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return alerts;
  }

  /**
   * Alert bestätigen
   */
  async acknowledgeAlert(alertId: string): Promise<any> {
    const alert = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'acknowledged',
        acknowledgedAt: new Date(),
      },
    });

    this.logger.log(`Alert acknowledged: ${alertId}`);
    return alert;
  }

  /**
   * Alert auflösen
   */
  async resolveAlert(alertId: string): Promise<any> {
    const alert = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
      },
    });

    this.logger.log(`Alert resolved: ${alertId}`);
    return alert;
  }

  /**
   * Alerts für eine Regel auflösen
   */
  private async resolveAlerts(ruleId: string): Promise<void> {
    await this.prisma.alert.updateMany({
      where: {
        alertRuleId: ruleId,
        status: 'open',
      },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Schwellenwert prüfen
   */
  private checkThreshold(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      default:
        return false;
    }
  }

  /**
   * Metrik-Wert abrufen (vereinfacht)
   */
  private async getMetricValue(metric: string, tenantId?: string): Promise<number | null> {
    // MVP: Aus DB abrufen
    // In Production: Aus Prometheus/Metrics-Service abrufen
    const metrics = await this.prisma.metric.findMany({
      where: {
        name: metric,
        ...(tenantId && { tenantId }),
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 1,
    });

    if (metrics.length === 0) {
      return null;
    }

    // Durchschnitt der letzten Werte
    return metrics[0].value;
  }

  /**
   * Alert-Nachricht generieren
   */
  private generateAlertMessage(rule: any, metricValue: number): string {
    return `Alert: ${rule.name} - Metric "${rule.metric}" value ${metricValue} ${rule.operator} threshold ${rule.threshold}`;
  }

  /**
   * Alert-Aktionen ausführen
   */
  private async executeAlertActions(alert: any, rule: any): Promise<void> {
    const actions = (rule.actions || []) as string[];

    for (const action of actions) {
      try {
        switch (action) {
          case 'email':
            await this.sendEmailAlert(alert, rule);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alert, rule);
            break;
          case 'slack':
            await this.sendSlackAlert(alert, rule);
            break;
          default:
            this.logger.warn(`Unknown alert action: ${action}`);
        }
      } catch (error) {
        this.logger.error(`Failed to execute alert action ${action}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Email-Alert senden (Placeholder)
   */
  private async sendEmailAlert(alert: any, rule: any): Promise<void> {
    // MVP: Placeholder
    this.logger.log(`Email alert sent for: ${alert.id}`, {
      recipients: rule.recipients,
    });
  }

  /**
   * Webhook-Alert senden (Placeholder)
   */
  private async sendWebhookAlert(alert: any, rule: any): Promise<void> {
    // MVP: Placeholder
    this.logger.log(`Webhook alert sent for: ${alert.id}`);
  }

  /**
   * Slack-Alert senden (Placeholder)
   */
  private async sendSlackAlert(alert: any, rule: any): Promise<void> {
    // MVP: Placeholder
    this.logger.log(`Slack alert sent for: ${alert.id}`);
  }
}


