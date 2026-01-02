import { Injectable } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';

@Injectable()
export class MetricsService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Metrics abrufen
   */
  async getMetrics(
    tenantId: string,
    options?: {
      types?: string[];
      timeRange?: string;
    },
  ): Promise<any> {
    const timeRange = options?.timeRange || '1h';
    const startTime = this.getTimeRangeStart(timeRange);

    const metrics = await this.prismaService.client.event.findMany({
      where: {
        tenantId,
        ts: {
          gte: startTime,
        },
        ...(options?.types && options.types.length > 0 && options.types[0] !== 'all'
          ? { type: { in: options.types } }
          : {}),
      },
      orderBy: {
        ts: 'desc',
      },
    });

    // Aggregiere Metrics nach Typ
    const aggregated = metrics.reduce(
      (acc: Record<string, { count: number; total: number }>, r: { type: string | null }) => {
        const type = r.type || 'unknown';
        if (!acc[type]) {
          acc[type] = { count: 0, total: 0 };
        }
        acc[type].count += 1;
        acc[type].total += 1;
        return acc;
      },
      {} as Record<string, { count: number; total: number }>,
    );

    return {
      metrics: aggregated,
      total: metrics.length,
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

    const ms = ranges[timeRange] || ranges['1h'];
    return new Date(now.getTime() - (ms ?? 0));
  }
}

