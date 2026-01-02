import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';

@Injectable()
export class ReportGeneratorService {
  // private readonly logger = new Logger(ReportGeneratorService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Report generieren
   */
  async generate(
    tenantId: string,
    reportType: string,
    options?: Record<string, any>,
  ): Promise<any> {
    switch (reportType) {
      case 'conversations':
        return await this.generateConversationsReport(tenantId, options);
      case 'metrics':
        return await this.generateMetricsReport(tenantId, options);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  /**
   * Conversations Report generieren
   */
  private async generateConversationsReport(
    tenantId: string,
    options?: Record<string, any>,
  ): Promise<any> {
    const conversations = await this.prisma.conversation.findMany({
      where: { tenantId },
      include: {
        messages: true,
      },
      take: options?.limit || 100,
    });

    return {
      type: 'conversations',
      total: conversations.length,
      conversations: conversations.map((c: any) => ({
        id: c.id,
        startedAt: c.startedAt,
        messageCount: c.messages.length,
      })),
    };
  }

  /**
   * Metrics Report generieren
   */
  private async generateMetricsReport(
    tenantId: string,
    options?: Record<string, any>,
  ): Promise<any> {
    const events = await this.prisma.event.findMany({
      where: { tenantId },
      take: options?.limit || 1000,
    });

    return {
      type: 'metrics',
      total: events.length,
      events: events.map((e: any) => ({
        id: e.id,
        type: e.type,
        timestamp: e.ts,
      })),
    };
  }
}

