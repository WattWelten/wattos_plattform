import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { ServiceDiscoveryService } from '@wattweiser/shared';

/**
 * Summary Service
 * Generiert Zusammenfassungen von Texten, Chats, Dokumenten
 */
@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  /**
   * Zusammenfassung erstellen
   */
  async createSummary(dto: CreateSummaryDto) {
    try {
      const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);

      // System-Prompt für Zusammenfassung
      const systemPrompt = `Du bist ein Experte für Textzusammenfassungen. Erstelle eine präzise, strukturierte Zusammenfassung des folgenden Textes. 
      
Wichtige Anforderungen:
- Fasse die wichtigsten Punkte zusammen
- Behalte die Kernaussagen bei
- Verwende eine klare, professionelle Sprache
- Strukturiere die Zusammenfassung mit Überschriften, wenn sinnvoll
- Maximale Länge: ${dto.maxLength || 500} Zeichen`;

      // LLM-Gateway aufrufen
      const response = await firstValueFrom(
        this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
          model: dto.model || 'gpt-4',
          provider: dto.provider || 'openai',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: dto.content,
            },
          ],
          temperature: 0.3, // Niedrige Temperature für präzise Zusammenfassungen
          max_tokens: dto.maxLength || 500,
        }),
      );

      const summary = response.data.choices[0]?.message?.content || '';

      return {
        summary,
        originalLength: dto.content.length,
        summaryLength: summary.length,
        compressionRatio: (summary.length / dto.content.length) * 100,
        model: dto.model || 'gpt-4',
        provider: dto.provider || 'openai',
      };
    } catch (error: any) {
      this.logger.error(`Summary creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Chat-Zusammenfassung erstellen
   */
  async summarizeChat(chatId: string, maxLength?: number) {
    // TODO: Chat aus DB laden
    // Für jetzt: Placeholder
    const chatContent = 'Chat content placeholder';

    return this.createSummary({
      content: chatContent,
      maxLength: maxLength || 500,
    });
  }

  /**
   * Dokument-Zusammenfassung erstellen
   */
  async summarizeDocument(documentId: string, maxLength?: number) {
    // TODO: Dokument aus DB laden
    // Für jetzt: Placeholder
    const documentContent = 'Document content placeholder';

    return this.createSummary({
      content: documentContent,
      maxLength: maxLength || 1000,
    });
  }
}


