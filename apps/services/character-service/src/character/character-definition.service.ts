import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '@wattweiser/db';
import { ProfileService, ProfilesModule } from '@wattweiser/core';
import { ServiceDiscoveryService } from '@wattweiser/shared';

/**
 * Character Definition Service
 * 
 * LLM-basierte Charakter-Extraktion aus Prompt und automatische Tenant-Profile-Erstellung
 */
@Injectable()
export class CharacterDefinitionService {
  private readonly logger = new Logger(CharacterDefinitionService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly profileService: ProfileService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  /**
   * Charakter aus Prompt definieren
   * 
   * Extrahiert automatisch: Name, Rolle, Persönlichkeit, Compliance-Anforderungen
   */
  async defineCharacterFromPrompt(
    tenantId: string,
    prompt: string,
  ): Promise<{
    characterId: string;
    name: string;
    role: string;
    personality: Record<string, unknown>;
    tenantProfileCreated: boolean;
  }> {
    try {
      this.logger.debug(`Defining character from prompt for tenant: ${tenantId}`, {
        promptLength: prompt.length,
      });

      // 1. LLM-basierte Extraktion
      const extracted = await this.extractCharacterFromPrompt(prompt);

      // 2. Character erstellen
      const character = await this.prisma.character.create({
        data: {
          tenantId,
          role: extracted.role,
          name: extracted.name,
          prompt,
          personality: extracted.personality,
          systemPrompt: extracted.systemPrompt,
          customParameters: {
            communicationStyle: extracted.communicationStyle,
            knowledgeAreas: extracted.knowledgeAreas,
            complianceRequirements: extracted.complianceRequirements,
          },
        },
      });

      this.logger.log(`Character created: ${character.id}`, {
        name: character.name,
        role: character.role,
      });

      // 3. Tenant-Profile erstellen basierend auf Charakter
      const tenantProfileCreated = await this.createTenantProfileFromCharacter(
        tenantId,
        character.id,
        extracted,
      );

      return {
        characterId: character.id,
        name: character.name || extracted.name,
        role: character.role,
        personality: (character.personality as Record<string, unknown>) || {},
        tenantProfileCreated,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Character definition failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * LLM-basierte Extraktion aus Prompt
   */
  private async extractCharacterFromPrompt(prompt: string): Promise<{
    name: string;
    role: string;
    personality: Record<string, unknown>;
    systemPrompt: string;
    communicationStyle: string;
    knowledgeAreas: string[];
    complianceRequirements: string[];
  }> {
    const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);

    const extractionPrompt = `Analysiere den folgenden Charakter-Prompt und extrahiere strukturierte Informationen:

Prompt: "${prompt}"

Extrahiere folgende Informationen im JSON-Format:
{
  "name": "Name des Charakters",
  "role": "Rolle/Funktion (z.B. 'Bürgerassistenz', 'Kundenberater')",
  "personality": {
    "traits": ["Eigenschaft1", "Eigenschaft2"],
    "tone": "Kommunikationston",
    "values": ["Wert1", "Wert2"]
  },
  "systemPrompt": "Optimierter System-Prompt für den Charakter",
  "communicationStyle": "Formell/Freundlich/Professionell/etc.",
  "knowledgeAreas": ["Bereich1", "Bereich2"],
  "complianceRequirements": ["GDPR", "AI Act", etc.]
}

Antworte NUR mit dem JSON-Objekt, keine zusätzlichen Erklärungen.`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${llmGatewayUrl}/v1/chat/completions`,
          {
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content:
                  'Du bist ein Experte für Charakter-Analyse. Extrahiere strukturierte Informationen aus Charakter-Prompts.',
              },
              {
                role: 'user',
                content: extractionPrompt,
              },
            ],
            temperature: 0.3, // Niedrig für konsistente Extraktion
            max_tokens: 2000,
          },
        ),
      );

      const content = response.data.choices[0]?.message?.content || '{}';
      
      // JSON aus Response extrahieren (falls zusätzlicher Text vorhanden)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonContent = jsonMatch ? jsonMatch[0] : content;
      
      const extracted = JSON.parse(jsonContent);

      // Validierung und Fallback-Werte
      return {
        name: extracted.name || 'Unbekannt',
        role: extracted.role || 'assistant',
        personality: extracted.personality || {
          traits: [],
          tone: 'freundlich',
          values: [],
        },
        systemPrompt: extracted.systemPrompt || prompt,
        communicationStyle: extracted.communicationStyle || 'freundlich',
        knowledgeAreas: Array.isArray(extracted.knowledgeAreas)
          ? extracted.knowledgeAreas
          : [],
        complianceRequirements: Array.isArray(extracted.complianceRequirements)
          ? extracted.complianceRequirements
          : [],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`LLM extraction failed, using fallback: ${errorMessage}`);

      // Fallback: Einfache Extraktion ohne LLM
      return this.fallbackExtraction(prompt);
    }
  }

  /**
   * Fallback-Extraktion ohne LLM
   */
  private fallbackExtraction(prompt: string): {
    name: string;
    role: string;
    personality: Record<string, unknown>;
    systemPrompt: string;
    communicationStyle: string;
    knowledgeAreas: string[];
    complianceRequirements: string[];
  } {
    // Einfache Regex-basierte Extraktion
    const nameMatch = prompt.match(/(?:Du bist|Ich bin|Name:)\s+([A-Z][a-z]+)/i);
    const name = nameMatch ? nameMatch[1] : 'Assistent';

    const roleMatch = prompt.match(/(?:die|der)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    const role = roleMatch ? roleMatch[1].toLowerCase().replace(/\s+/g, '-') : 'assistant';

    return {
      name,
      role,
      personality: {
        traits: [],
        tone: 'freundlich',
        values: [],
      },
      systemPrompt: prompt,
      communicationStyle: 'freundlich',
      knowledgeAreas: [],
      complianceRequirements: [],
    };
  }

  /**
   * Tenant-Profile aus Charakter erstellen
   */
  private async createTenantProfileFromCharacter(
    tenantId: string,
    characterId: string,
    extracted: {
      complianceRequirements: string[];
      knowledgeAreas: string[];
    },
  ): Promise<boolean> {
    try {
      // Prüfen ob Profile bereits existiert
      const existingProfile = await this.prisma.tenantProfile.findUnique({
        where: { tenantId },
      });

      if (existingProfile) {
        this.logger.debug(`Tenant profile already exists: ${tenantId}`);
        return false;
      }

      // Market bestimmen basierend auf Compliance-Requirements
      let market = 'enterprise';
      let mode = 'standard';

      if (extracted.complianceRequirements.some((req) => req.toLowerCase().includes('gov'))) {
        market = 'gov';
        mode = 'gov-f13'; // Für Kommune/Schule
      } else if (extracted.complianceRequirements.some((req) => req.toLowerCase().includes('health'))) {
        market = 'health';
        mode = 'regulated';
      }

      // Profile erstellen
      await this.prisma.tenantProfile.create({
        data: {
          tenantId,
          market,
          mode,
          providers: {
            llm: mode === 'gov-f13' ? 'f13' : 'wattweiser',
            rag: mode === 'gov-f13' ? 'f13' : 'wattweiser',
            parser: mode === 'gov-f13' ? 'f13' : 'wattweiser',
            summarize: mode === 'gov-f13' ? 'f13' : 'wattweiser',
          },
          compliance: {
            gdpr: extracted.complianceRequirements.some((req) =>
              req.toLowerCase().includes('gdpr'),
            ),
            aiAct: extracted.complianceRequirements.some((req) =>
              req.toLowerCase().includes('ai act'),
            ),
            disclosure: market === 'gov',
            retentionDays: market === 'gov' ? 365 : 90,
          },
          features: {
            guidedFlows: market === 'gov',
            sourceRequired: market === 'gov',
            hitlRequired: false,
            toolCallsEnabled: true,
            visionEnabled: false,
            webChat: true,
            phone: market !== 'gov',
            whatsapp: market !== 'gov',
          },
        },
      });

      this.logger.log(`Tenant profile created: ${tenantId}`, {
        market,
        mode,
      });

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to create tenant profile: ${errorMessage}`, {
        tenantId,
      });
      return false;
    }
  }
}
