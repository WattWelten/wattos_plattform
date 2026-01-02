import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@wattweiser/db';
import { firstValueFrom } from 'rxjs';
import { RefinePersonaDto } from './dto/refine-persona.dto';
import { ServiceDiscoveryService } from '@wattweiser/shared';

@Injectable()
export class PersonasService {
  private readonly logger = new Logger(PersonasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  /**
   * Personas für eine Analyse generieren
   */
  async generatePersonas(analysisId: string, targetGroupIds?: string[]): Promise<any[]> {
    try {
      // Analyse mit Target Groups laden
      const analysis = await this.prisma.client.customerAnalysis.findUnique({
        where: { id: analysisId },
        include: {
          targetGroups: targetGroupIds
            ? {
                where: { id: { in: targetGroupIds } },
              }
            : true,
        },
      });

      if (!analysis) {
        throw new NotFoundException(`Analysis ${analysisId} not found`);
      }

      const personas = [];

      // Für jede Target Group eine Persona generieren
      for (const targetGroup of analysis.targetGroups) {
        const persona = await this.generatePersonaForTargetGroup(analysisId, targetGroup.id, targetGroup);
        personas.push(persona);
      }

      this.logger.log(`Generated ${personas.length} personas for analysis ${analysisId}`);
      return personas;
    } catch (error: any) {
      this.logger.error(`Failed to generate personas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Persona für eine Target Group generieren
   */
  private async generatePersonaForTargetGroup(
    analysisId: string,
    targetGroupId: string,
    targetGroup: any,
  ): Promise<any> {
    try {
      const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);

      const prompt = `Erstelle eine detaillierte Persona basierend auf der folgenden Zielgruppe:

Zielgruppe: ${targetGroup.name}
Beschreibung: ${targetGroup.description}
Demografie: ${JSON.stringify(targetGroup.demographics)}
Verhaltensmuster: ${JSON.stringify(targetGroup.behaviorPatterns)}
Sprache: ${targetGroup.language}

Erstelle eine Persona mit:
- name: Name der Persona (z.B. "Maria, 35, junge Mutter")
- description: Detaillierte Beschreibung
- characteristics: { personality, needs, values }
- painPoints: Array von Herausforderungen
- goals: Array von Zielen
- communicationStyle: { tone, preferredChannels, language }

Antworte als JSON-Objekt.`;

      const response = await firstValueFrom(
        this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
          model: 'gpt-4',
          provider: 'openai',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Experte für Persona-Entwicklung. Antworte nur mit gültigem JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      );

      const content = response.data.choices[0]?.message?.content || '{}';
      let personaData: any;
      try {
        // Versuche JSON zu parsen, auch wenn es in Code-Blöcken ist
        const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        personaData = JSON.parse(cleanedContent);
      } catch (parseError: any) {
        this.logger.error(`Failed to parse LLM response: ${parseError.message}`);
        this.logger.debug(`Response content: ${content.substring(0, 500)}`);
        // Fallback: Basis-Persona
        personaData = {
          name: targetGroup.name || 'Unnamed Persona',
          description: targetGroup.description || '',
          characteristics: {},
          painPoints: [],
          goals: [],
          communicationStyle: {},
        };
      }

      // Persona in DB speichern
      const persona = await this.prisma.client.persona.create({
        data: {
          analysisId,
          targetGroupId,
          name: personaData.name,
          description: personaData.description,
          characteristics: personaData.characteristics || {},
          painPoints: personaData.painPoints || [],
          goals: personaData.goals || [],
          communicationStyle: personaData.communicationStyle || {},
          language: targetGroup.language,
        },
      });

      return persona;
    } catch (error: any) {
      this.logger.error(`Failed to generate persona for target group ${targetGroupId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Persona abrufen
   */
  async getPersona(id: string) {
    const persona = await this.prisma.client.persona.findUnique({
      where: { id },
      include: {
        analysis: true,
        targetGroup: true,
      },
    });

    if (!persona) {
      throw new NotFoundException(`Persona ${id} not found`);
    }

    return persona;
  }

  /**
   * Personas für eine Analyse abrufen
   */
  async getPersonasByAnalysis(analysisId: string) {
    return this.prisma.client.persona.findMany({
      where: { analysisId },
      include: {
        targetGroup: true,
      },
    });
  }

  /**
   * Persona manuell verfeinern
   */
  async refinePersona(id: string, dto: RefinePersonaDto) {
    const persona = await this.prisma.client.persona.findUnique({
      where: { id },
    });

    if (!persona) {
      throw new NotFoundException(`Persona ${id} not found`);
    }

    return this.prisma.client.persona.update({
      where: { id },
      data: {
        name: dto.name ?? persona.name,
        description: dto.description ?? persona.description,
        characteristics: dto.characteristics ?? persona.characteristics,
        painPoints: dto.painPoints ?? persona.painPoints,
        goals: dto.goals ?? persona.goals,
        communicationStyle: dto.communicationStyle ?? persona.communicationStyle,
      },
    });
  }
}

