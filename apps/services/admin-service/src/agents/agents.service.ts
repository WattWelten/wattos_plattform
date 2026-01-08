import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';

export interface CreateAgentDto {
  name: string;
  role: string;
  roleType: string;
  tools?: string[];
  ragConfig?: Record<string, any>;
  personaConfig?: Record<string, any>;
  toolsConfig?: any[];
  policiesConfig?: Record<string, any>;
  kpiConfig?: Record<string, any>;
  characterId?: string;
  personaId?: string;
}

export interface UpdateAgentDto extends Partial<CreateAgentDto> {}

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async createAgent(dto: CreateAgentDto, tenantId: string) {
    try {
      const agent = await this.prismaService.client.agent.create({
        data: {
          tenantId,
          name: dto.name,
          role: dto.role,
          roleType: dto.roleType,
          tools: dto.tools || [],
          ragConfig: dto.ragConfig || null,
          personaConfig: dto.personaConfig || {},
          toolsConfig: dto.toolsConfig || [],
          policiesConfig: dto.policiesConfig || {},
          kpiConfig: dto.kpiConfig || {},
          characterId: dto.characterId || null,
          personaId: dto.personaId || null,
        },
      });

      this.logger.log(`Agent created: ${agent.id}`);
      return agent;
    } catch (error: any) {
      this.logger.error(`Failed to create agent: ${error.message}`);
      throw error;
    }
  }

  async listAgents(tenantId: string) {
    try {
      const agents = await this.prismaService.client.agent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });

      return agents;
    } catch (error: any) {
      this.logger.error(`Failed to list agents: ${error.message}`);
      throw error;
    }
  }

  async getAgent(id: string, tenantId: string) {
    try {
      const agent = await this.prismaService.client.agent.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!agent) {
        throw new NotFoundException(`Agent ${id} not found`);
      }

      return agent;
    } catch (error: any) {
      this.logger.error(`Failed to get agent: ${error.message}`);
      throw error;
    }
  }

  async updateAgent(id: string, dto: UpdateAgentDto, tenantId: string) {
    try {
      // Prüfe ob Agent existiert und zum Tenant gehört
      const existing = await this.getAgent(id, tenantId);

      const agent = await this.prismaService.client.agent.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.role && { role: dto.role }),
          ...(dto.roleType && { roleType: dto.roleType }),
          ...(dto.tools !== undefined && { tools: dto.tools }),
          ...(dto.ragConfig !== undefined && { ragConfig: dto.ragConfig }),
          ...(dto.personaConfig !== undefined && { personaConfig: dto.personaConfig }),
          ...(dto.toolsConfig !== undefined && { toolsConfig: dto.toolsConfig }),
          ...(dto.policiesConfig !== undefined && { policiesConfig: dto.policiesConfig }),
          ...(dto.kpiConfig !== undefined && { kpiConfig: dto.kpiConfig }),
          ...(dto.characterId !== undefined && { characterId: dto.characterId || null }),
          ...(dto.personaId !== undefined && { personaId: dto.personaId || null }),
        },
      });

      this.logger.log(`Agent updated: ${agent.id}`);
      return agent;
    } catch (error: any) {
      this.logger.error(`Failed to update agent: ${error.message}`);
      throw error;
    }
  }

  async deleteAgent(id: string, tenantId: string) {
    try {
      // Prüfe ob Agent existiert und zum Tenant gehört
      await this.getAgent(id, tenantId);

      await this.prismaService.client.agent.delete({
        where: { id },
      });

      this.logger.log(`Agent deleted: ${id}`);
    } catch (error: any) {
      this.logger.error(`Failed to delete agent: ${error.message}`);
      throw error;
    }
  }
}
