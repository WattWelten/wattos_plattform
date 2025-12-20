import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Data Enrichment Service
 * 
 * Reichert gecrawlte Daten mit LLM an
 */
@Injectable()
export class DataEnrichmentService {
  private readonly logger = new Logger(DataEnrichmentService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.llmGatewayUrl =
      this.configService.get<string>('LLM_GATEWAY_URL') ||
      'http://localhost:3009';
  }

  private readonly llmGatewayUrl: string;

  /**
   * Daten anreichern
   */
  async enrichData(validatedData: any[], metadata: any): Promise<any[]> {
    this.logger.debug(`Enriching ${validatedData.length} validated pages`);

    const enrichedData = [];

    for (const page of validatedData) {
      try {
        const enriched = await this.enrichPage(page, metadata);
        enrichedData.push(enriched);
      } catch (error) {
        this.logger.warn(`Failed to enrich page ${page.url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Fallback: Original-Daten verwenden
        enrichedData.push(page);
      }
    }

    this.logger.log(`Enriched ${enrichedData.length} of ${validatedData.length} pages`);
    return enrichedData;
  }

  /**
   * Einzelne Seite anreichern
   */
  private async enrichPage(page: any, metadata: any): Promise<any> {
    // LLM-basierte Anreicherung
    const enrichmentPrompt = `Du bist ein Experte für Daten-Anreicherung. Reichere den folgenden Text an:

Titel: ${page.title}
Inhalt: ${page.content.substring(0, 2000)}...

Bitte:
1. Erstelle eine kurze Zusammenfassung (2-3 Sätze)
2. Identifiziere die wichtigsten Keywords
3. Kategorisiere den Inhalt
4. Erstelle 3-5 relevante Fragen, die dieser Text beantwortet

Antworte im JSON-Format:
{
  "summary": "...",
  "keywords": ["..."],
  "category": "...",
  "questions": ["..."]
}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.llmGatewayUrl}/v1/chat/completions`, {
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Experte für Daten-Anreicherung und strukturierte Daten-Extraktion.',
            },
            {
              role: 'user',
              content: enrichmentPrompt,
            },
          ],
          model: 'gpt-4o-mini',
          temperature: 0.3,
        }),
      );

      const enrichment = this.parseEnrichmentResponse(
        response.data.choices[0]?.message?.content || '',
      );

      return {
        ...page,
        enrichment: {
          summary: enrichment.summary || '',
          keywords: enrichment.keywords || [],
          category: enrichment.category || 'general',
          questions: enrichment.questions || [],
        },
        enrichedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`LLM enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Fallback: Basis-Anreicherung
      return {
        ...page,
        enrichment: {
          summary: page.content.substring(0, 200),
          keywords: this.extractKeywords(page.content),
          category: 'general',
          questions: [],
        },
        enrichedAt: new Date(),
      };
    }
  }

  /**
   * Enrichment-Response parsen
   */
  private parseEnrichmentResponse(content: string): any {
    try {
      // Versuche JSON zu extrahieren
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      this.logger.warn('Failed to parse enrichment response as JSON');
    }

    return {};
  }

  /**
   * Keywords extrahieren (Fallback)
   */
  private extractKeywords(text: string): string[] {
    // Einfache Keyword-Extraktion (erste 10 Wörter > 5 Zeichen)
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 5)
      .slice(0, 10);

    return [...new Set(words)];
  }
}
