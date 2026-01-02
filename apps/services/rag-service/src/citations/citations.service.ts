import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { Citation, CitationRequest } from './interfaces/citations.interface';

/**
 * Citations Service
 * Generiert und formatiert Citations für LLM-Responses
 */
@Injectable()
export class CitationsService {
  private readonly logger = new Logger(CitationsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Citations generieren
   */
  async generateCitations(request: CitationRequest): Promise<Citation[]> {
    try {
      const citations: Citation[] = [];

      for (const chunkId of request.chunkIds) {
        // Chunk aus DB abrufen
        const chunk = await this.prismaService.client.chunk.findUnique({
          where: { id: chunkId },
          include: {
            document: true,
          },
        });

        if (!chunk) {
          this.logger.warn(`Chunk ${chunkId} not found`);
          continue;
        }

        // Citation erstellen
        const citation: Citation = {
          chunkId: chunk.id,
          documentId: chunk.documentId,
          documentName: chunk.document?.fileName || 'Unknown',
          content: chunk.content.substring(0, 300), // Erste 300 Zeichen
          score: request.scores?.[chunkId] || 0,
          metadata: {
            ...chunk.metadata,
            fileType: chunk.document?.fileType,
            fileSize: chunk.document?.fileSize,
          },
        };

        citations.push(citation);
      }

      return citations;
    } catch (error: any) {
      this.logger.error(`Citation generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Citations für Markdown formatieren
   */
  formatCitationsForMarkdown(citations: Citation[]): string {
    if (citations.length === 0) {
      return '';
    }

    const citationLines = citations.map((citation, index) => {
      return `[${index + 1}] ${citation.documentName} (Score: ${citation.score.toFixed(2)})`;
    });

    return `\n\n**Quellen:**\n${citationLines.join('\n')}`;
  }

  /**
   * Citations für JSON formatieren
   */
  formatCitationsForJSON(citations: Citation[]): any[] {
    return citations.map((citation) => ({
      chunkId: citation.chunkId,
      documentId: citation.documentId,
      documentName: citation.documentName,
      content: citation.content,
      score: citation.score,
      metadata: citation.metadata,
    }));
  }
}


