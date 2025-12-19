import { Controller, Get, Param, Query } from '@nestjs/common';
import { KpiService } from './kpi.service';

@Controller('kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('agents/:agentId')
  async getAgentKPIs(@Param('agentId') agentId: string, @Query('start') start?: string, @Query('end') end?: string) {
    const timeRange = start && end
      ? {
          start: new Date(start),
          end: new Date(end),
        }
      : undefined;

    return this.kpiService.calculateKPIs(agentId, timeRange);
  }
}


