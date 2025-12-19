import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';

/**
 * Agent Validator Service
 * 
 * Validiert generierte Agents
 */
@Injectable()
export class AgentValidatorService {
  private readonly logger = new Logger(AgentValidatorService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Agent validieren
   */
  async validateAgent(agentId: string): Promise<boolean> {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        return false;
      }

      // Validierungs-Kriterien
      const checks = [
        agent.name && agent.name.length > 0,
        agent.role && agent.role.length > 0,
        Array.isArray(agent.tools) && agent.tools.length > 0,
        agent.personaConfig && typeof agent.personaConfig === 'object',
      ];

      const allValid = checks.every((check) => check === true);

      if (!allValid) {
        this.logger.warn(`Agent validation failed: ${agentId}`, {
          checks,
        });
      }

      return allValid;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Agent validation error: ${errorMessage}`, { agentId });
      return false;
    }
  }
}


