import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@wattweiser/db';
import { firstValueFrom } from 'rxjs';
import { GenerateAgentsDto } from './dto/generate-agents.dto';
import { ServiceDiscoveryService } from '@wattweiser/shared';

@Injectable()
export class AgentGenerationService {
  private readonly logger = new Logger(AgentGenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  /**
   * Agents für Personas generieren
   */
  async generateAgents(dto: GenerateAgentsDto) {
    try {
      // Analyse mit Personas und Target Groups laden
      const analysis = await this.prisma.customerAnalysis.findUnique({
        where: { id: dto.analysisId },
        include: {
          personas: dto.personaIds
            ? {
                where: { id: { in: dto.personaIds } },
              }
            : true,
          targetGroups: dto.targetGroupIds
            ? {
                where: { id: { in: dto.targetGroupIds } },
              }
            : true,
        },
      });

      if (!analysis) {
        throw new NotFoundException(`Analysis ${dto.analysisId} not found`);
      }

      const agentGenerations = [];

      // Für jede Persona einen Agent generieren
      for (const persona of analysis.personas) {
        const generation = await this.generateAgentForPersona(
          dto.analysisId,
          persona.id,
          persona.targetGroupId,
          persona,
        );
        agentGenerations.push(generation);
      }

      this.logger.log(`Generated ${agentGenerations.length} agents for analysis ${dto.analysisId}`);
      return agentGenerations;
    } catch (error: any) {
      this.logger.error(`Failed to generate agents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Agent für eine Persona generieren
   */
  private async generateAgentForPersona(
    analysisId: string,
    personaId: string,
    targetGroupId: string | null,
    persona: any,
  ): Promise<any> {
    try {
      // Agent Generation in DB erstellen
      const generation = await this.prisma.agentGeneration.create({
        data: {
          analysisId,
          personaId,
          targetGroupId,
          status: 'generating',
          generationConfig: {},
        },
      });

      try {
        // System-Prompt generieren
        const systemPrompt = await this.generateSystemPrompt(persona);

        // Tools auswählen
        const tools = this.selectTools(persona);

        // Knowledge Base verknüpfen (aus Analysis)
        const knowledgeBase = await this.linkKnowledgeBase(analysisId);
        
        // System-Prompt mit Knowledge Base-Informationen erweitern
        let enhancedSystemPrompt = systemPrompt;
        if (knowledgeBase.knowledgeSpaceId) {
          enhancedSystemPrompt = `${systemPrompt}\n\nVerwende den Knowledge Space "${knowledgeBase.name}" für deine Antworten.`;
        }

        // Agent direkt in DB erstellen (Agent-Service hat keinen CREATE-Endpunkt)
        const analysis = await this.prisma.customerAnalysis.findUnique({
          where: { id: analysisId },
          select: { tenantId: true },
        });

        if (!analysis) {
          throw new NotFoundException(`Analysis ${analysisId} not found`);
        }

        const agent = await this.prisma.agent.create({
          data: {
            tenantId: analysis.tenantId,
            name: `${persona.name} - Agent`,
            roleType: this.mapPersonaToRoleType(persona),
            personaConfig: {
              name: persona.name,
              description: persona.description,
              characteristics: persona.characteristics,
              painPoints: persona.painPoints,
              goals: persona.goals,
              communicationStyle: persona.communicationStyle,
              language: persona.language,
            },
            toolsConfig: tools,
            policiesConfig: {
              language: persona.language,
              targetGroup: targetGroupId,
            },
            kpiConfig: {},
          },
        });

        const agentId = agent.id;

        // Agent Generation aktualisieren
        await this.prisma.agentGeneration.update({
          where: { id: generation.id },
          data: {
            agentId,
            status: 'completed',
            completedAt: new Date(),
            generationConfig: {
              systemPrompt: enhancedSystemPrompt,
              tools,
              knowledgeBase,
            },
          },
        });

        this.logger.log(`Agent ${agentId} generated for persona ${personaId}`);
        return { ...generation, agentId, status: 'completed' };
      } catch (error: any) {
        // Fehler in Generation speichern
        await this.prisma.agentGeneration.update({
          where: { id: generation.id },
          data: {
            status: 'failed',
            error: error.message,
          },
        });
        throw error;
      }
    } catch (error: any) {
      this.logger.error(`Failed to generate agent for persona ${personaId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * System-Prompt generieren
   */
  private async generateSystemPrompt(persona: any): Promise<string> {
    const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);

    const prompt = `Erstelle einen System-Prompt für einen KI-Agenten, der für die folgende Persona entwickelt wurde:

Persona: ${persona.name}
Beschreibung: ${persona.description}
Charakteristika: ${JSON.stringify(persona.characteristics)}
Pain Points: ${JSON.stringify(persona.painPoints)}
Goals: ${JSON.stringify(persona.goals)}
Kommunikationsstil: ${JSON.stringify(persona.communicationStyle)}
Sprache: ${persona.language}

Der System-Prompt sollte:
- Die Rolle des Agenten klar definieren
- Den Kommunikationsstil widerspiegeln
- Auf die Pain Points und Goals eingehen
- In der Zielsprache (${persona.language}) formuliert sein
- Empathisch und hilfreich sein

Antworte nur mit dem System-Prompt-Text.`;

    const response = await firstValueFrom(
      this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
        model: 'gpt-4',
        provider: 'openai',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Experte für System-Prompt-Erstellung. Antworte nur mit dem Prompt-Text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    );

    return response.data.choices[0]?.message?.content || '';
  }

  /**
   * Tools basierend auf Persona-Bedürfnissen auswählen
   */
  private selectTools(persona: any): string[] {
    const tools: string[] = ['retrieval']; // Immer Retrieval-Tool

    // Basierend auf Pain Points und Goals weitere Tools hinzufügen
    const painPoints = persona.painPoints || [];
    const goals = persona.goals || [];

    if (painPoints.some((p: string) => p.toLowerCase().includes('email'))) {
      tools.push('email');
    }
    if (painPoints.some((p: string) => p.toLowerCase().includes('calendar'))) {
      tools.push('calendar');
    }
    if (goals.some((g: string) => g.toLowerCase().includes('ticket'))) {
      tools.push('jira');
    }

    return tools;
  }

  /**
   * Knowledge Base verknüpfen
   */
  private async linkKnowledgeBase(analysisId: string): Promise<any> {
    try {
      // Analyse mit Tenant laden
      const analysis = await this.prisma.customerAnalysis.findUnique({
        where: { id: analysisId },
        include: {
          tenant: {
            include: {
              knowledgeSpaces: {
                take: 1,
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });

      if (analysis?.tenant?.knowledgeSpaces && analysis.tenant.knowledgeSpaces.length > 0) {
        const knowledgeSpace = analysis.tenant.knowledgeSpaces[0];
        return {
          knowledgeSpaceId: knowledgeSpace.id,
          name: knowledgeSpace.name,
          description: knowledgeSpace.description,
        };
      }

      // Fallback: Kein Knowledge Space gefunden
      this.logger.warn(`No knowledge space found for analysis ${analysisId}`);
      return {
        knowledgeSpaceId: null,
        name: 'Default Knowledge Space',
      };
    } catch (error: any) {
      this.logger.error(`Failed to link knowledge base: ${error.message}`);
      return {
        knowledgeSpaceId: null,
        name: 'Default Knowledge Space',
      };
    }
  }

  /**
   * Persona zu Role Type mappen
   */
  private mapPersonaToRoleType(persona: any): string {
    // Einfache Heuristik basierend auf Persona-Name oder Goals
    const name = persona.name.toLowerCase();
    const goals = (persona.goals || []).join(' ').toLowerCase();

    if (name.includes('support') || goals.includes('support')) {
      return 'it-support-assist';
    }
    if (name.includes('sales') || goals.includes('sales')) {
      return 'sales-assist';
    }
    if (name.includes('marketing') || goals.includes('marketing')) {
      return 'marketing-assist';
    }

    return 'chatbot'; // Default
  }

  /**
   * Generation-Status abrufen
   */
  async getGeneration(id: string) {
    const generation = await this.prisma.agentGeneration.findUnique({
      where: { id },
      include: {
        analysis: true,
        persona: true,
        targetGroup: true,
        agent: true,
      },
    });

    if (!generation) {
      throw new NotFoundException(`Generation ${id} not found`);
    }

    return generation;
  }
}

