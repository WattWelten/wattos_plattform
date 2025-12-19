import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@wattweiser/db';
import { firstValueFrom } from 'rxjs';
import { ServiceDiscoveryService } from '@wattweiser/shared';

@Injectable()
export class TargetGroupService {
  private readonly logger = new Logger(TargetGroupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  /**
   * Zielgruppen identifizieren basierend auf aggregierten Daten
   */
  async identifyTargetGroups(analysisId: string, aggregatedData: any): Promise<any[]> {
    try {
      // LLM-basierte Analyse über LLM Gateway
      const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);
      
      const prompt = `Analysiere die folgenden Daten und identifiziere Zielgruppen:
      
Crawler-Daten: ${JSON.stringify(aggregatedData.crawler).substring(0, 2000)}
Dokumente: ${JSON.stringify(aggregatedData.documents).substring(0, 2000)}
Conversations: ${JSON.stringify(aggregatedData.conversations).substring(0, 2000)}

Erstelle eine Liste von Zielgruppen mit:
- name: Name der Zielgruppe
- description: Beschreibung
- demographics: { ageRange, gender, location }
- language: Hauptsprache (de, en, tr, etc.)
- behaviorPatterns: { interactions, preferences }
- contentPreferences: { preferredContentTypes }
- size: Geschätzte Größe
- confidence: Konfidenz-Score (0.0-1.0)

Antworte als JSON-Array.`;

      const response = await firstValueFrom(
        this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
          model: 'gpt-4',
          provider: 'openai',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Experte für Zielgruppen-Analyse. Antworte nur mit gültigem JSON.',
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

      const content = response.data.choices[0]?.message?.content || '[]';
      let targetGroups: any[];
      try {
        // Versuche JSON zu parsen, auch wenn es in Code-Blöcken ist
        const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        targetGroups = JSON.parse(cleanedContent);
        if (!Array.isArray(targetGroups)) {
          this.logger.warn('LLM response is not an array, wrapping in array');
          targetGroups = [targetGroups];
        }
      } catch (parseError: any) {
        this.logger.error(`Failed to parse LLM response: ${parseError.message}`);
        this.logger.debug(`Response content: ${content.substring(0, 500)}`);
        // Fallback: Leeres Array
        targetGroups = [];
      }

      // Zielgruppen in DB speichern
      const createdTargetGroups = [];
      for (const tg of targetGroups) {
        const created = await this.prisma.targetGroup.create({
          data: {
            analysisId,
            name: tg.name,
            description: tg.description,
            demographics: tg.demographics || {},
            behaviorPatterns: tg.behaviorPatterns || {},
            language: tg.language || 'de',
            contentPreferences: tg.contentPreferences || {},
            size: tg.size,
            confidence: tg.confidence || 0.5,
          },
        });
        createdTargetGroups.push(created);
      }

      this.logger.log(`Identified ${createdTargetGroups.length} target groups for analysis ${analysisId}`);
      return createdTargetGroups;
    } catch (error: any) {
      this.logger.error(`Failed to identify target groups: ${error.message}`);
      throw error;
    }
  }

  /**
   * Demografie-Analyse
   */
  async analyzeDemographics(data: any[]): Promise<any> {
    // Einfache Heuristiken für Demografie-Analyse
    // Später erweiterbar mit ML-Modellen
    return {
      ageRange: { min: 18, max: 65 },
      gender: { male: 0.5, female: 0.5 },
      location: 'de',
    };
  }

  /**
   * Verhaltensanalyse
   */
  async analyzeBehaviorPatterns(data: any[]): Promise<any> {
    // Einfache Heuristiken für Verhaltensanalyse
    return {
      interactions: [],
      preferences: [],
    };
  }

  /**
   * Sprach-Erkennung
   */
  async detectLanguages(data: any[]): Promise<string[]> {
    // Einfache Sprach-Erkennung basierend auf Content
    // Später erweiterbar mit NLP-Bibliotheken
    const languages = new Set<string>();
    for (const item of data) {
      if (item.content || item.text) {
        const text = (item.content || item.text).toLowerCase();
        if (text.includes('der ') || text.includes('die ') || text.includes('das ')) {
          languages.add('de');
        }
        if (text.includes('the ') || text.includes('and ') || text.includes('is ')) {
          languages.add('en');
        }
        if (text.includes('ve ') || text.includes('bir ') || text.includes('ile ')) {
          languages.add('tr');
        }
      }
    }
    return Array.from(languages).length > 0 ? Array.from(languages) : ['de'];
  }
}

