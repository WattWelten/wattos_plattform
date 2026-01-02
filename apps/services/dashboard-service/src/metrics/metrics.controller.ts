import { Controller, Get, Param, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get(':tenantId')
  async getMetrics(
    @Param('tenantId') tenantId: string,
    @Query('types') types?: string,
    @Query('timeRange') timeRange?: string,
  ) {
    const typesArray = types ? types.split(',') : undefined;
    return await this.metricsService.getMetrics(tenantId, {
      types: typesArray,
      timeRange: timeRange || '1h',
    });
  }
}

