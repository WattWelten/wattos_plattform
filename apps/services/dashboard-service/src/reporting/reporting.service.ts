import { Injectable } from '@nestjs/common';
import { ReportGeneratorService } from './report-generator.service';

@Injectable()
export class ReportingService {
  // private readonly logger = new Logger(ReportingService.name);

  constructor(private readonly reportGenerator: ReportGeneratorService) {}

  /**
   * Report generieren
   */
  async generateReport(
    tenantId: string,
    reportType: string,
    options?: Record<string, any>,
  ): Promise<any> {
    return await this.reportGenerator.generate(tenantId, reportType, options);
  }
}

