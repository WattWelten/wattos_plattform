import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ReportingService } from './reporting.service';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get(':tenantId')
  async getReport(
    @Param('tenantId') tenantId: string,
    @Query('type') type: string,
    @Query() options: Record<string, any>,
  ) {
    return await this.reportingService.generateReport(tenantId, type, options);
  }

  @Post(':tenantId')
  async generateReportPost(
    @Param('tenantId') tenantId: string,
    @Body() body: { type: string; options?: Record<string, any> },
  ) {
    return await this.reportingService.generateReport(tenantId, body.type, body.options);
  }
}

