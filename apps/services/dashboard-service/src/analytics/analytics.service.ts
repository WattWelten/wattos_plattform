import { Injectable } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';

@Injectable()
export class AnalyticsService {
  // private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Analytics abrufen
   */
  async getAnalytics(
    tenantId: string,
    options?: {
      timeRange?: string;
      [key: string]: any;
    },
  ): Promise<any> {
    const timeRange = options?.timeRange || '7d';
    const startTime = this.getTimeRangeStart(timeRange);

    const conversations = await this.prismaService.client.conversation.findMany({
      where: {
        tenantId,
        startedAt: {
          gte: startTime,
        },
      },
      include: {
        messages: true,
      },
    });

    return {
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((sum: number, c: any) => sum + c.messages.length, 0),
      avgMessagesPerConversation:
        conversations.length > 0
          ? conversations.reduce((sum: number, c: any) => sum + c.messages.length, 0) / conversations.length
          : 0,
      timeRange,
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

