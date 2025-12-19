import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';

/**
 * KPI Service
 * Berechnet und tracked KPIs für Agenten
 */
@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * KPIs für Agent berechnen
   */
  async calculateKPIs(agentId: string, timeRange?: { start: Date; end: Date }) {
    const runs = await this.prisma.agentRun.findMany({
      where: {
        agentId,
        createdAt: timeRange
          ? {
              gte: timeRange.start,
              lte: timeRange.end,
            }
          : undefined,
      },
    });

    const completedRuns = runs.filter((r) => r.status === 'completed');
    const failedRuns = runs.filter((r) => r.status === 'failed');

    // FCR Rate
    const fcrRate = this.calculateFCRRate(runs);

    // Lead Time
    const avgLeadTime = this.calculateAvgLeadTime(completedRuns);

    // Cost per Run
    const avgCost = this.calculateAvgCost(completedRuns);

    // Tool Efficiency
    const toolEfficiency = this.calculateToolEfficiency(completedRuns);

    return {
      totalRuns: runs.length,
      completedRuns: completedRuns.length,
      failedRuns: failedRuns.length,
      successRate: completedRuns.length / runs.length,
      fcrRate,
      avgLeadTime,
      avgCost,
      toolEfficiency,
    };
  }

  /**
   * FCR Rate berechnen
   */
  private calculateFCRRate(runs: any[]): number {
    // Annahme: FCR wenn kein Tool-Call für Eskalation
    const fcrRuns = runs.filter((r) => {
      const metrics = r.metrics as any;
      return !metrics.toolCalls?.some((tc: any) => tc.toolName === 'escalate');
    });

    return runs.length > 0 ? fcrRuns.length / runs.length : 0;
  }

  /**
   * Durchschnittliche Lead Time berechnen
   */
  private calculateAvgLeadTime(runs: any[]): number {
    if (runs.length === 0) {
      return 0;
    }

    const totalDuration = runs.reduce((sum, r) => {
      const metrics = r.metrics as any;
      return sum + (metrics.duration || 0);
    }, 0);

    return totalDuration / runs.length / 1000 / 60; // in Minuten
  }

  /**
   * Durchschnittliche Kosten berechnen
   */
  private calculateAvgCost(runs: any[]): number {
    if (runs.length === 0) {
      return 0;
    }

    const totalCost = runs.reduce((sum, r) => {
      const metrics = r.metrics as any;
      return sum + (metrics.costUsd || 0);
    }, 0);

    return totalCost / runs.length;
  }

  /**
   * Tool-Effizienz berechnen
   */
  private calculateToolEfficiency(runs: any[]): number {
    if (runs.length === 0) {
      return 0;
    }

    const totalEfficiency = runs.reduce((sum, r) => {
      const metrics = r.metrics as any;
      const toolCallsCount = metrics.toolCallsCount || 0;
      const outputLength = r.output?.length || 0;

      if (toolCallsCount === 0) {
        return sum;
      }

      return sum + outputLength / toolCallsCount;
    }, 0);

    return totalEfficiency / runs.length;
  }
}


