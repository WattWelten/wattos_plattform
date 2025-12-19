import { Controller, Get, Query, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { ReportingService } from './reporting.service';

/**
 * Reporting Controller
 * 
 * REST API für Report-Generierung
 */
@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  /**
   * Report generieren und herunterladen
   */
  @Get()
  async generateReport(
    @Query('tenantId') tenantId: string,
    @Query('type') type: 'daily' | 'weekly' | 'monthly' = 'weekly',
    @Query('format') format: 'pdf' | 'csv' | 'json' = 'json',
    @Res() res: Response,
  ) {
    const report = await this.reportingService.generateReport(tenantId, {
      type,
      format,
    });

    const filename = `report-${type}-${Date.now()}.${format}`;
    const contentType = this.getContentType(format);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (format === 'json' || format === 'csv') {
      res.send(report);
    } else {
      res.send(report);
    }
  }

  /**
   * Content-Type für Format bestimmen
   */
  private getContentType(format: string): string {
    switch (format) {
      case 'pdf':
        return 'application/pdf';
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }
}


