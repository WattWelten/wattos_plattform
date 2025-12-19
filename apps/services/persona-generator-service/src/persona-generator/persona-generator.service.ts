import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaClient } from '@wattweiser/db';
import { ServiceDiscoveryService } from '@wattweiser/shared';
import { QualityFilterService } from './quality-filter.service';

/**
 * Persona Generator Service
 * 
 * LLM-basierte Persona-Generierung aus gecrawlten Daten und Charakter-Definition
 */
@Injectable()
export class PersonaGeneratorService {
  private readonly logger = new Logger(PersonaGeneratorService.name);
  private readonly prisma: PrismaClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
    private readonly qualityFilter: QualityFilterService,
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Personas für einen Character generieren
   */
  async generatePersonasForCharacter(
    characterId: string,
    options?: {
      maxPersonas?: number;
      minQualityScore?: number;
    },
  ): Promise<{
    personas: Array<{
      id: string;
      name: string;
      description: string;
      traits: Record<string, unknown>;
      qualityScore: number;
    }>;
    totalGenerated: number;
    filtered: number;
  }> {
    try {
      // Character laden
      const character = await this.prisma.character.findUnique({
        where: { id: characterId },
        include: {
          tenant: true,
        },
      });

      if (!character) {
        throw new NotFoundException(`Character not found: ${characterId}`);
      }

      // Gecrawlte Daten abrufen (aus Knowledge Space)
      const crawledData = await this.getCrawledData(character.tenantId, characterId);

      // LLM-basierte Persona-Generierung
      const generatedPersonas = await this.generatePersonasWithLLM(
        character,
        crawledData,
        options?.maxPersonas || 10,
      );

      // Qualitäts-Filter anwenden
      const minQualityScore = options?.minQualityScore || 0.7;
      const filteredPersonas = generatedPersonas.filter(
        (p) => p.qualityScore >= minQualityScore,
      );

      // Personas in Datenbank speichern
      const savedPersonas = await Promise.all(
        filteredPersonas.map((persona) =>
          this.savePersona(characterId, persona, character.tenantId),
        ),
      );

      this.logger.log(`Generated ${savedPersonas.length} personas for character: ${characterId}`, {
        totalGenerated: generatedPersonas.length,
        filtered: generatedPersonas.length - filteredPersonas.length,
      });

      return {
        personas: savedPersonas.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          traits: (p.traits as Record<string, unknown>) || {},
          qualityScore: p.qualityScore || 0,
        })),
        totalGenerated: generatedPersonas.length,
        filtered: generatedPersonas.length - filteredPersonas.length,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Persona generation failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Gecrawlte Daten abrufen
   */
  private async getCrawledData(tenantId: string, characterId: string): Promise<string> {
    try {
      // Dokumente aus Knowledge Space abrufen (die durch Crawling erstellt wurden)
      const documents = await this.prisma.document.findMany({
        where: {
          knowledgeSpace: {
            tenantId,
          },
          metadata: {
            path: ['characterId'],
            equals: characterId,
          },
        },
        take: 50, // Limit für Performance
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Content zusammenfassen
      const content = documents
        .map((doc) => {
          const metadata = doc.metadata as Record<string, unknown>;
          return `Title: ${doc.fileName}\nContent: ${metadata.content || ''}`;
        })
        .join('\n\n');

      return content || 'Keine gecrawlten Daten verfügbar.';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to get crawled data: ${errorMessage}`);
      return '';
    }
  }

  /**
   * LLM-basierte Persona-Generierung
   */
  private async generatePersonasWithLLM(
    character: {
      name: string | null;
      role: string;
      personality: Record<string, unknown> | null;
      prompt: string;
    },
    crawledData: string,
    maxPersonas: number,
  ): Promise<Array<{
    name: string;
    description: string;
    traits: Record<string, unknown>;
    characteristics: Record<string, unknown>;
    painPoints: string[];
    goals: string[];
    communicationStyle: Record<string, unknown>;
    language: string;
    qualityScore: number;
  }>> {
    const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);

    const prompt = `Erstelle ${maxPersonas} verschiedene Personas basierend auf:

Charakter: ${character.name || character.role}
Rolle: ${character.role}
Persönlichkeit: ${JSON.stringify(character.personality || {})}
Charakter-Prompt: ${character.prompt}

Gecrawlte Daten:
${crawledData.substring(0, 5000)} ${crawledData.length > 5000 ? '...' : ''}

Erstelle für jede Persona:
- name: Name der Persona (z.B. "Maria, 35, junge Mutter")
- description: Detaillierte Beschreibung (mind. 200 Zeichen)
- traits: { personality: [], needs: [], values: [] }
- characteristics: { demographics: {}, behaviorPatterns: {} }
- painPoints: Array von Herausforderungen (mind. 3)
- goals: Array von Zielen (mind. 3)
- communicationStyle: { tone: "", preferredChannels: [], language: "de" }
- language: "de"

Antworte als JSON-Array mit ${maxPersonas} Persona-Objekten. Jede Persona muss einzigartig sein und verschiedene Zielgruppen repräsentieren.`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'Du bist ein Experte für Persona-Entwicklung. Antworte nur mit gültigem JSON-Array.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8, // Höhere Temperatur für Vielfalt
          max_tokens: 4000,
        }),
      );

      const content = response.data.choices[0]?.message?.content || '[]';
      
      // JSON aus Response extrahieren
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonContent = jsonMatch ? jsonMatch[0] : content;
      
      const personas = JSON.parse(jsonContent) as Array<{
        name: string;
        description: string;
        traits: Record<string, unknown>;
        characteristics: Record<string, unknown>;
        painPoints: string[];
        goals: string[];
        communicationStyle: Record<string, unknown>;
        language: string;
      }>;

      // Qualitäts-Score für jede Persona berechnen
      const personasWithScore = personas.map((persona) => ({
        ...persona,
        qualityScore: this.qualityFilter.calculateQualityScore(persona),
      }));

      return personasWithScore;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`LLM persona generation failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Persona in Datenbank speichern
   */
  private async savePersona(
    characterId: string,
    persona: {
      name: string;
      description: string;
      traits: Record<string, unknown>;
      characteristics: Record<string, unknown>;
      painPoints: string[];
      goals: string[];
      communicationStyle: Record<string, unknown>;
      language: string;
      qualityScore: number;
    },
    tenantId: string,
  ) {
    return this.prisma.persona.create({
      data: {
        characterId,
        name: persona.name,
        description: persona.description,
        traits: persona.traits,
        characteristics: persona.characteristics,
        painPoints: persona.painPoints,
        goals: persona.goals,
        communicationStyle: persona.communicationStyle,
        language: persona.language,
        metadata: {
          qualityScore: persona.qualityScore,
          generatedAt: new Date().toISOString(),
        },
      },
    });
  }
}


