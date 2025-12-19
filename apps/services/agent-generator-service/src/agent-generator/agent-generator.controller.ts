import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AgentGeneratorService } from './agent-generator.service';
import { GenerateAgentsDto } from './dto/generate-agents.dto';

@Controller('agents')
export class AgentGeneratorController {
  constructor(private readonly agentGeneratorService: AgentGeneratorService) {}

  /**
   * Agents für Personas generieren
   */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generateAgents(@Body() dto: GenerateAgentsDto) {
    return this.agentGeneratorService.generateAgentsForPersonas(dto.personaIds, {
      validate: dto.validate,
    });
  }
}

