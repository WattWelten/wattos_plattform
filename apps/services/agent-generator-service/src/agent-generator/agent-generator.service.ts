import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaClient } from '@wattweiser/db';
import { ServiceDiscoveryService } from '@wattweiser/shared';
import { ToolSelectorService } from './tool-selector.service';
import { RAGConfigService } from './rag-config.service';
import { AgentValidatorService } from './agent-validator.service';

/**
 * Agent Generator Service
 * 
 * Automatische Agent-Generierung aus Personas mit Tool-Zuordnung und RAG-Konfiguration
 */
@Injectable()
export class AgentGeneratorService {
  private readonly logger = new Logger(AgentGeneratorService.name);
  private readonly prisma: PrismaClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
    private readonly toolSelector: ToolSelectorService,
    private readonly ragConfig: RAGConfigService,
    private readonly validator: AgentValidatorService,
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Agents für Personas generieren
   */
  async generateAgentsForPersonas(
    personaIds: string[],
    options?: {
      validate?: boolean;
    },
  ): Promise<{
    agents: Array<{
      id: string;
      name: string;
      role: string;
      tools: string[];
      ragConfig: Record<string, unknown>;
      valid: boolean;
    }>;
    totalGenerated: number;
    validated: number;
  }> {
    try {
      const agents = await Promise.all(
        personaIds.map((personaId) => this.generateAgentForPersona(personaId, options?.validate)),
      );

      const validatedAgents = agents.filter((a) => a.valid);
      const totalGenerated = agents.length;

      this.logger.log(`Generated ${totalGenerated} agents from ${personaIds.length} personas`, {
        validated: validatedAgents.length,
      });

      return {
        agents: validatedAgents.map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          tools: a.tools,
          ragConfig: a.ragConfig,
          valid: a.valid,
        })),
        totalGenerated,
        validated: validatedAgents.length,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Agent generation failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Agent für eine Persona generieren
   */
  private async generateAgentForPersona(
    personaId: string,
    validate: boolean = true,
  ): Promise<{
    id: string;
    name: string;
    role: string;
    tools: string[];
    ragConfig: Record<string, unknown>;
    valid: boolean;
  }> {
    // Persona laden
    const persona = await this.prisma.persona.findUnique({
      where: { id: personaId },
      include: {
        character: true,
      },
    });

    if (!persona) {
      throw new NotFoundException(`Persona not found: ${personaId}`);
    }

    if (!persona.character) {
      throw new NotFoundException(`Persona has no character: ${personaId}`);
    }

    // System-Prompt generieren
    const systemPrompt = await this.generateSystemPrompt(persona);

    // Tools auswählen
    const tools = await this.toolSelector.selectTools(persona);

    // RAG-Konfiguration erstellen
    const ragConfig = await this.ragConfig.createRAGConfig(persona, persona.character.tenantId);

    // Agent erstellen
    const agent = await this.prisma.agent.create({
      data: {
        tenantId: persona.character.tenantId,
        characterId: persona.characterId || undefined,
        personaId: persona.id,
        name: `${persona.name} Agent`,
        role: persona.name,
        roleType: 'persona-based',
        tools,
        ragConfig,
        personaConfig: {
          systemPrompt,
          communicationStyle: persona.communicationStyle,
          traits: persona.traits,
        },
        toolsConfig: tools.map((toolId) => ({ id: toolId })),
        policiesConfig: {},
        kpiConfig: {},
      },
    });

    // Validierung (optional)
    let valid = true;
    if (validate) {
      valid = await this.validator.validateAgent(agent.id);
    }

    return {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      tools,
      ragConfig: (ragConfig as Record<string, unknown>) || {},
      valid,
    };
  }

  /**
   * System-Prompt generieren
   */
  private async generateSystemPrompt(persona: {
    name: string;
    description: string | null;
    traits: Record<string, unknown> | null;
    characteristics: Record<string, unknown>;
    painPoints: unknown[];
    goals: unknown[];
    communicationStyle: Record<string, unknown>;
  }): Promise<string> {
    const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);

    const prompt = `Erstelle einen optimierten System-Prompt für einen KI-Agenten basierend auf:

Persona: ${persona.name}
Beschreibung: ${persona.description || 'Keine Beschreibung'}
Eigenschaften: ${JSON.stringify(persona.traits || {})}
Charakteristika: ${JSON.stringify(persona.characteristics)}
Herausforderungen: ${JSON.stringify(persona.painPoints)}
Ziele: ${JSON.stringify(persona.goals)}
Kommunikationsstil: ${JSON.stringify(persona.communicationStyle)}

Der System-Prompt sollte:
- Die Rolle und Persönlichkeit des Agents klar definieren
- Den Kommunikationsstil widerspiegeln
- Die Ziele und Herausforderungen der Persona berücksichtigen
- Professionell und präzise formuliert sein

Antworte nur mit dem System-Prompt, keine zusätzlichen Erklärungen.`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Experte für System-Prompt-Erstellung. Antworte nur mit dem System-Prompt.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      );

      return response.data.choices[0]?.message?.content || this.fallbackSystemPrompt(persona);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`LLM system prompt generation failed: ${errorMessage}`);
      return this.fallbackSystemPrompt(persona);
    }
  }

  /**
   * Fallback System-Prompt
   */
  private fallbackSystemPrompt(persona: {
    name: string;
    description: string | null;
    communicationStyle: Record<string, unknown>;
  }): string {
    const tone = (persona.communicationStyle.tone as string) || 'freundlich';
    return `Du bist ${persona.name}, ein ${tone} Assistent. ${persona.description || ''}`;
  }
}

