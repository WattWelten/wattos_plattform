import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AgentsService, CreateAgentDto, UpdateAgentDto } from './agents.service';
import { JwtAuthGuard } from '@nestjs/passport';
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  async createAgent(
    @Body() dto: CreateAgentDto,
    @Tenant() tenantId: string
  ) {
    return this.agentsService.createAgent(dto, tenantId);
  }

  @Get()
  async listAgents(@Tenant() tenantId: string) {
    return this.agentsService.listAgents(tenantId);
  }

  @Get(':id')
  async getAgent(
    @Param('id') id: string,
    @Tenant() tenantId: string
  ) {
    return this.agentsService.getAgent(id, tenantId);
  }

  @Put(':id')
  async updateAgent(
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
    @Tenant() tenantId: string
  ) {
    return this.agentsService.updateAgent(id, dto, tenantId);
  }

  @Delete(':id')
  async deleteAgent(
    @Param('id') id: string,
    @Tenant() tenantId: string
  ) {
    await this.agentsService.deleteAgent(id, tenantId);
    return { success: true };
  }
}
