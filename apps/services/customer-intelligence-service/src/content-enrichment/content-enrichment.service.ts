import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@wattweiser/db';
import { firstValueFrom } from 'rxjs';
import { EnrichContentDto } from './dto/enrich-content.dto';
import { ServiceDiscoveryService } from '@wattweiser/shared';

@Injectable()
export class ContentEnrichmentService {
  private readonly logger = new Logger(ContentEnrichmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  /**
   * Content für Zielgruppe anreichern
   */
  async enrichContent(dto: EnrichContentDto) {
    try {
      // Target Group prüfen
      const targetGroup = await this.prisma.targetGroup.findUnique({
        where: { id: dto.targetGroupId },
      });

      if (!targetGroup) {
        throw new NotFoundException(`Target group ${dto.targetGroupId} not found`);
      }

      // Relevanz-Score berechnen (falls nicht angegeben)
      const relevanceScore =
        dto.relevanceScore ?? (await this.calculateRelevanceScore(dto.content, targetGroup));

      // Sprache erkennen (falls nicht angegeben)
      const language = dto.language ?? (await this.detectLanguage(dto.content));

      // Content Enrichment in DB speichern
      const enrichment = await this.prisma.contentEnrichment.create({
        data: {
          targetGroupId: dto.targetGroupId,
          sourceType: dto.sourceType,
          sourceId: dto.sourceId,
          content: dto.content,
          relevanceScore,
          language,
          metadata: {},
        },
      });

      this.logger.log(`Content enriched for target group ${dto.targetGroupId} with score ${relevanceScore}`);
      return enrichment;
    } catch (error: any) {
      this.logger.error(`Failed to enrich content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Relevanz-Score berechnen
   */
  private async calculateRelevanceScore(content: string, targetGroup: any): Promise<number> {
    try {
      const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);

      const prompt = `Bewerte die Relevanz des folgenden Contents für die Zielgruppe:

Content: ${content.substring(0, 2000)}

Zielgruppe: ${targetGroup.name}
Beschreibung: ${targetGroup.description}
Demografie: ${JSON.stringify(targetGroup.demographics)}
Verhaltensmuster: ${JSON.stringify(targetGroup.behaviorPatterns)}
Content-Präferenzen: ${JSON.stringify(targetGroup.contentPreferences)}

Bewerte die Relevanz auf einer Skala von 0.0 bis 1.0, wobei:
- 1.0 = Sehr relevant, perfekt auf Zielgruppe zugeschnitten
- 0.5 = Teilweise relevant
- 0.0 = Nicht relevant

Antworte nur mit einer Zahl zwischen 0.0 und 1.0.`;

      const response = await firstValueFrom(
        this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
          model: 'gpt-4',
          provider: 'openai',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Experte für Content-Relevanz-Bewertung. Antworte nur mit einer Zahl.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 10,
        }),
      );

      const score = parseFloat(response.data.choices[0]?.message?.content || '0.5');
      return Math.max(0.0, Math.min(1.0, score)); // Clamp zwischen 0.0 und 1.0
    } catch (error: any) {
      this.logger.warn(`Failed to calculate relevance score: ${error.message}`);
      return 0.5; // Default score
    }
  }

  /**
   * Sprache erkennen
   */
  private async detectLanguage(content: string): Promise<string> {
    // Einfache Sprach-Erkennung
    const text = content.toLowerCase();
    if (text.includes('der ') || text.includes('die ') || text.includes('das ')) {
      return 'de';
    }
    if (text.includes('the ') || text.includes('and ') || text.includes('is ')) {
      return 'en';
    }
    if (text.includes('ve ') || text.includes('bir ') || text.includes('ile ')) {
      return 'tr';
    }
    return 'de'; // Default
  }

  /**
   * Content zu Target Group mappen
   */
  async mapToTargetGroup(content: string, analysisId: string): Promise<string | null> {
    try {
      // Target Groups der Analyse laden
      const targetGroups = await this.prisma.targetGroup.findMany({
        where: { analysisId },
      });

      if (targetGroups.length === 0) {
        return null;
      }

      // Für jede Target Group Relevanz-Score berechnen
      const scores = await Promise.all(
        targetGroups.map(async (tg) => ({
          targetGroupId: tg.id,
          score: await this.calculateRelevanceScore(content, tg),
        })),
      );

      // Target Group mit höchstem Score auswählen
      const bestMatch = scores.reduce((prev, current) =>
        current.score > prev.score ? current : prev,
      );

      return bestMatch.score > 0.5 ? bestMatch.targetGroupId : null; // Nur wenn Score > 0.5
    } catch (error: any) {
      this.logger.error(`Failed to map content to target group: ${error.message}`);
      return null;
    }
  }

  /**
   * Angereicherten Content für Target Group abrufen
   */
  async getEnrichedContent(targetGroupId: string, minRelevanceScore: number = 0.5) {
    return this.prisma.contentEnrichment.findMany({
      where: {
        targetGroupId,
        relevanceScore: {
          gte: minRelevanceScore,
        },
      },
      orderBy: {
        relevanceScore: 'desc',
      },
    });
  }
}

