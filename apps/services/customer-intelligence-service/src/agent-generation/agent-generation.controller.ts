import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AgentGenerationService } from './agent-generation.service';
import { GenerateAgentsDto } from './dto/generate-agents.dto';

@Controller('api/v1/analytics')
export class AgentGenerationController {
  constructor(private readonly agentGenerationService: AgentGenerationService) {}

  @Post('generate-agents')
  async generateAgents(@Body() dto: GenerateAgentsDto) {
    return this.agentGenerationService.generateAgents(dto);
  }

  @Get('generations/:id')
  async getGeneration(@Param('id') id: string) {
    return this.agentGenerationService.getGeneration(id);
  }
}














