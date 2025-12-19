import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Alert Rule Service
 * 
 * Verwaltet Alert-Regeln und prüft kontinuierlich auf Verstöße
 */
@Injectable()
export class AlertRuleService {
  private readonly logger = new Logger(AlertRuleService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Alert-Regel erstellen
   */
  async createAlertRule(
    tenantId: string | undefined,
    name: string,
    metric: string,
    threshold: number,
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte',
    duration: number,
    severity: 'info' | 'warning' | 'error' | 'critical',
    description?: string,
    actions?: string[],
    recipients?: string[],
  ): Promise<any> {
    const alertRule = await this.prisma.alertRule.create({
      data: {
        tenantId: tenantId || null,
        name,
        description,
        metric,
        threshold,
        operator,
        duration,
        severity,
        actions: (actions || []) as any,
        recipients: (recipients || []) as any,
        enabled: true,
      },
    });

    this.logger.log(`Alert rule created: ${alertRule.id}`, { name, metric, threshold });
    return alertRule;
  }

  /**
   * Alert-Regeln auflisten
   */
  async listAlertRules(
    tenantId?: string,
    enabled?: boolean,
  ): Promise<any[]> {
    const rules = await this.prisma.alertRule.findMany({
      where: {
        ...(tenantId && { tenantId }),
        ...(enabled !== undefined && { enabled }),
      },
      include: {
        alerts: {
          where: { status: 'open' },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return rules;
  }

  /**
   * Alert-Regel aktualisieren
   */
  async updateAlertRule(
    ruleId: string,
    updates: {
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
  ): Promise<any> {
    const alertRule = await this.prisma.alertRule.update({
      where: { id: ruleId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.threshold !== undefined && { threshold: updates.threshold }),
        ...(updates.operator && { operator: updates.operator }),
        ...(updates.duration !== undefined && { duration: updates.duration }),
        ...(updates.severity && { severity: updates.severity }),
        ...(updates.enabled !== undefined && { enabled: updates.enabled }),
        ...(updates.actions && { actions: updates.actions as any }),
        ...(updates.recipients && { recipients: updates.recipients as any }),
      },
    });

    this.logger.log(`Alert rule updated: ${ruleId}`);
    return alertRule;
  }

  /**
   * Alert-Regel löschen
   */
  async deleteAlertRule(ruleId: string): Promise<void> {
    await this.prisma.alertRule.delete({
      where: { id: ruleId },
    });

    this.logger.log(`Alert rule deleted: ${ruleId}`);
  }
}

