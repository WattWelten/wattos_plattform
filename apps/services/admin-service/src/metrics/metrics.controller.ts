import { Controller, Get, Query, Param } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('dashboard')
  async getDashboardMetrics(@Query('tenantId') tenantId: string) {
    return this.metricsService.getDashboardMetrics(tenantId);
  }

  @Get('llm-usage')
  async getLLMUsageMetrics(
    @Query('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.metricsService.getLLMUsageMetrics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('agents/performance')
  async getAgentPerformanceMetrics(
    @Query('tenantId') tenantId: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.metricsService.getAgentPerformanceMetrics(tenantId, agentId);
  }
}


