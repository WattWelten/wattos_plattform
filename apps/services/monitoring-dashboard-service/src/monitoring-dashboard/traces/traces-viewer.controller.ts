import { Controller, Get, Query } from '@nestjs/common';
import { TracesViewerService } from './traces-viewer.service';

/**
 * Traces Viewer Controller
 * 
 * REST API für Trace-Viewer
 */
@Controller('dashboard/traces')
export class TracesViewerController {
  constructor(private readonly tracesViewerService: TracesViewerService) {}

  /**
   * Trace-Informationen abrufen
   */
  @Get('info')
  async getTraceInfo() {
    return await this.tracesViewerService.getTraceInfo();
  }

  /**
   * Traces abrufen
   */
  @Get()
  async getTraces(
    @Query('tenantId') tenantId?: string,
    @Query('service') service?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.tracesViewerService.getTraces(
      tenantId,
      service,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit ? parseInt(limit, 10) : 100,
    );
  }
}

