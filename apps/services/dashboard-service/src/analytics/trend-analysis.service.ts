import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';

/**
 * Trend Analysis Service
 * 
 * Analysiert Trends über Zeiträume
 */
@Injectable()
export class TrendAnalysisService {
  private readonly logger = new Logger(TrendAnalysisService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Trends analysieren
   */
  async analyzeTrends(tenantId: string, startDate: Date): Promise<any> {
    const [conversationTrend, agentTrend, kbTrend] = await Promise.all([
      this.getConversationTrend(tenantId, startDate),
      this.getAgentTrend(tenantId, startDate),
      this.getKBTrend(tenantId, startDate),
    ]);

    return {
      conversations: conversationTrend,
      agents: agentTrend,
      kbArticles: kbTrend,
    };
  }

  /**
   * Conversation Trend
   */
  private async getConversationTrend(
    tenantId: string,
    startDate: Date,
  ): Promise<any> {
    // Gruppiere nach Tagen
    const conversations = await this.prisma.conversation.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Gruppiere nach Tagen
    const dailyCounts: Record<string, number> = {};
    conversations.forEach((conv) => {
      const date = conv.createdAt.toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return {
      data: Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        count,
      })),
      trend: this.calculateTrend(Object.values(dailyCounts)),
    };
  }

  /**
   * Agent Trend
   */
  private async getAgentTrend(
    tenantId: string,
    startDate: Date,
  ): Promise<any> {
    const agents = await this.prisma.agent.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const dailyCounts: Record<string, number> = {};
    agents.forEach((agent) => {
      const date = agent.createdAt.toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return {
      data: Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        count,
      })),
      trend: this.calculateTrend(Object.values(dailyCounts)),
    };
  }

  /**
   * KB Trend
   */
  private async getKBTrend(tenantId: string, startDate: Date): Promise<any> {
    const articles = await this.prisma.kBArticle.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        f13SyncStatus: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const dailyCounts: Record<string, number> = {};
    articles.forEach((article) => {
      const date = article.createdAt.toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return {
      data: Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        count,
      })),
      trend: this.calculateTrend(Object.values(dailyCounts)),
    };
  }

  /**
   * Trend berechnen (einfache lineare Regression)
   */
  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) {
      return 'stable';
    }

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg =
      firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (diff > 10) {
      return 'up';
    } else if (diff < -10) {
      return 'down';
    } else {
      return 'stable';
    }
  }
}

