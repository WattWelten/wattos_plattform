import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { AnalyticsService } from '../analytics/analytics.service';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Dashboard Data Aggregation Service
 * 
 * Aggregiert Daten aus verschiedenen Quellen für Dashboard-Widgets
 */
@Injectable()
export class DashboardDataAggregationService {
  private readonly logger = new Logger(DashboardDataAggregationService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly analytics: AnalyticsService,
    private readonly metrics: MetricsService,
  ) {}

  /**
   * Dashboard-Daten aggregieren
   */
  async aggregateDashboardData(
    tenantId: string,
    dashboard: { id: string; name: string; layout?: any; config?: any },
  ): Promise<{
    id: string;
    name: string;
    layout: any;
    widgets: Record<string, any>;
    updatedAt: Date;
  }> {
    const widgets = dashboard.layout?.widgets || [];
    const widgetData: Record<string, any> = {};

    // Parallel alle Widget-Daten aggregieren
    await Promise.all(
      widgets.map(async (widget: any) => {
        try {
          widgetData[widget.id] = await this.aggregateWidgetData(
            tenantId,
            widget,
          );
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(`Failed to aggregate widget data: ${errorMessage}`, {
            widgetId: widget.id,
          });
          widgetData[widget.id] = { error: errorMessage };
        }
      }),
    );

    return {
      id: dashboard.id,
      name: dashboard.name,
      layout: dashboard.layout,
      widgets: widgetData,
      updatedAt: new Date(),
    };
  }

  /**
   * Widget-Daten aggregieren
   */
  private async aggregateWidgetData(
    tenantId: string,
    widget: { id: string; type: string; position?: any; config?: any },
  ): Promise<any> {
    switch (widget.type) {
      case 'overview':
        return await this.getOverviewData(tenantId);
      
      case 'conversations':
        return await this.getConversationsData(tenantId, widget.config);
      
      case 'agents':
        return await this.getAgentsData(tenantId, widget.config);
      
      case 'analytics':
        return await this.getAnalyticsData(tenantId, widget.config);
      
      case 'metrics':
        return await this.getMetricsData(tenantId, widget.config);
      
      case 'kb-sync':
        return await this.getKBSyncData(tenantId, widget.config);
      
      default:
        return { error: `Unknown widget type: ${widget.type}` };
    }
  }

  /**
   * Overview-Daten
   */
  private async getOverviewData(tenantId: string): Promise<any> {
    const [conversations, agents, kbArticles, syncStatus] = await Promise.all([
      this.prismaService.client.conversation.count({ where: { tenantId } }),
      this.prismaService.client.agent.count({ where: { tenantId } }),
      this.prismaService.client.kBArticle.count({ where: { tenantId } }),
      this.getKBSyncStatus(tenantId),
    ]);

    return {
      conversations,
      agents,
      kbArticles,
      kbSyncStatus: syncStatus,
    };
  }

  /**
   * Conversations-Daten
   */
  private async getConversationsData(tenantId: string, config?: any): Promise<any> {
    const limit = config?.limit || 10;
    const timeRange = config?.timeRange || '7d';

    const conversations = await this.prismaService.client.conversation.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: this.getTimeRangeStart(timeRange),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        messageCount: true,
      },
    });

    return {
      conversations,
      total: conversations.length,
    };
  }

  /**
   * Agents-Daten
   */
  private async getAgentsData(tenantId: string, _config?: any): Promise<any> {
    const agents = await this.prismaService.client.agent.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      agents,
      total: agents.length,
      active: agents.filter((a: any) => a.status === 'active').length,
    };
  }

  /**
   * Analytics-Daten
   */
  private async getAnalyticsData(tenantId: string, config?: any): Promise<any> {
    const timeRange = config?.timeRange || '7d';
    return await this.analytics.getAnalytics(tenantId, {
      timeRange,
      ...config,
    });
  }

  /**
   * Metrics-Daten
   */
  private async getMetricsData(tenantId: string, config?: any): Promise<any> {
    const metricTypes = config?.types || ['all'];
    const timeRange = config?.timeRange || '1h';

    return await this.metrics.getMetrics(tenantId, {
      types: metricTypes,
      timeRange,
    });
  }

  /**
   * KB-Sync-Daten
   */
  private async getKBSyncData(tenantId: string, _config?: any): Promise<any> {
    return await this.getKBSyncStatus(tenantId);
  }

  /**
   * KB-Sync-Status
   */
  private async getKBSyncStatus(tenantId: string): Promise<any> {
    const [total, synced, pending, error] = await Promise.all([
      this.prismaService.client.kBArticle.count({ where: { tenantId } }),
      this.prismaService.client.kBArticle.count({
        where: { tenantId, f13SyncStatus: 'synced' },
      }),
      this.prismaService.client.kBArticle.count({
        where: { tenantId, f13SyncStatus: 'pending' },
      }),
      this.prismaService.client.kBArticle.count({
        where: { tenantId, f13SyncStatus: 'error' },
      }),
    ]);

    return {
      total,
      synced,
      pending,
      error,
      syncRate: total > 0 ? (synced / total) * 100 : 0,
    };
  }

  /**
   * Time-Range Start berechnen
   */
  private getTimeRangeStart(timeRange: string): Date {
    const now = new Date();
    const ranges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const ms = ranges[timeRange] || ranges['7d'];
    return new Date(now.getTime() - (ms ?? 0));
  }
}
