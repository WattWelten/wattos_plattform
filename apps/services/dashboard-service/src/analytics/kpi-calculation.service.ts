import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';

/**
 * KPI Calculation Service
 * 
 * Berechnet Key Performance Indicators
 */
@Injectable()
export class KPICalculationService {
  private readonly logger = new Logger(KPICalculationService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * KPIs berechnen
   */
  async calculateKPIs(tenantId: string, startDate: Date): Promise<any> {
    const [
      totalConversations,
      completedConversations,
      avgResponseTime,
      userSatisfaction,
      kbSyncRate,
    ] = await Promise.all([
      this.getTotalConversations(tenantId, startDate),
      this.getCompletedConversations(tenantId, startDate),
      this.getAvgResponseTime(tenantId, startDate),
      this.getUserSatisfaction(tenantId, startDate),
      this.getKBSyncRate(tenantId),
    ]);

    const completionRate =
      totalConversations > 0
        ? (completedConversations / totalConversations) * 100
        : 0;

    return {
      totalConversations,
      completedConversations,
      completionRate: Math.round(completionRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      userSatisfaction: Math.round(userSatisfaction * 100) / 100,
      kbSyncRate: Math.round(kbSyncRate * 100) / 100,
    };
  }

  /**
   * Total Conversations
   */
  private async getTotalConversations(
    tenantId: string,
    startDate: Date,
  ): Promise<number> {
    return await this.prisma.conversation.count({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
    });
  }

  /**
   * Completed Conversations
   */
  private async getCompletedConversations(
    tenantId: string,
    startDate: Date,
  ): Promise<number> {
    return await this.prisma.conversation.count({
      where: {
        tenantId,
        status: 'completed',
        createdAt: { gte: startDate },
      },
    });
  }

  /**
   * Average Response Time (Placeholder - benötigt Message-Timestamps)
   */
  private async getAvgResponseTime(
    tenantId: string,
    startDate: Date,
  ): Promise<number> {
    // MVP: Placeholder
    // In Production: Berechnung basierend auf Message-Timestamps
    return 0;
  }

  /**
   * User Satisfaction (Placeholder - benötigt Feedback-Daten)
   */
  private async getUserSatisfaction(
    tenantId: string,
    startDate: Date,
  ): Promise<number> {
    // MVP: Placeholder
    // In Production: Berechnung basierend auf Feedback-Scores
    return 0;
  }

  /**
   * KB Sync Rate
   */
  private async getKBSyncRate(tenantId: string): Promise<number> {
    const [total, synced] = await Promise.all([
      this.prisma.kBArticle.count({ where: { tenantId } }),
      this.prisma.kBArticle.count({
        where: { tenantId, f13SyncStatus: 'synced' },
      }),
    ]);

    return total > 0 ? (synced / total) * 100 : 0;
  }
}


