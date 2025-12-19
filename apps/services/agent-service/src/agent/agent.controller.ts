import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { RunAgentDto } from './dto/run-agent.dto';

@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post(':agentId/run')
  async runAgent(@Param('agentId') agentId: string, @Body() dto: RunAgentDto) {
    return this.agentService.runAgentWithGraph(agentId, dto.input, dto.userId);
  }

  @Get('runs/:runId')
  async getRunStatus(@Param('runId') runId: string) {
    return this.agentService.getRunStatus(runId);
  }
}


