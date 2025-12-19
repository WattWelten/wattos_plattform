import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { ReportGeneratorService } from './report-generator.service';
import { AnalyticsService } from '../analytics/analytics.service';

/**
 * Reporting Service
 * 
 * Verwaltet Report-Generierung und -Export
 */
@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);
  private readonly prisma: PrismaClient;

  constructor(
    private readonly reportGenerator: ReportGeneratorService,
    private readonly analytics: AnalyticsService,
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Report generieren
   */
  async generateReport(
    tenantId: string,
    options: {
      type: 'daily' | 'weekly' | 'monthly';
      format: 'pdf' | 'csv' | 'json';
      timeRange?: string;
    },
  ): Promise<Buffer | string> {
    const timeRange = this.getTimeRangeForType(options.type);
    
    // Analytics-Daten abrufen
    const analyticsData = await this.analytics.getAnalytics(tenantId, {
      timeRange,
    });

    // Report generieren
    switch (options.format) {
      case 'pdf':
        return await this.reportGenerator.generatePDF(tenantId, analyticsData, options.type);
      case 'csv':
        return await this.reportGenerator.generateCSV(tenantId, analyticsData, options.type);
      case 'json':
        return await this.reportGenerator.generateJSON(tenantId, analyticsData, options.type);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  /**
   * Time-Range für Report-Typ berechnen
   */
  private getTimeRangeForType(type: string): string {
    switch (type) {
      case 'daily':
        return '24h';
      case 'weekly':
        return '7d';
      case 'monthly':
        return '30d';
      default:
        return '7d';
    }
  }
}

