import { Injectable, Logger } from '@nestjs/common';
import { SearchResultItem } from '../search/interfaces/search.interface';
import { ContextRequest, ContextResult } from './interfaces/context.interface';

/**
 * Context Service
 * Bereitet RAG-Context für LLM-Aufrufe auf
 */
@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);

  /**
   * Context aus Search-Results erstellen
   */
  async buildContext(request: ContextRequest): Promise<ContextResult> {
    try {
      const { searchResults, maxTokens = 2000, includeMetadata = true } = request;

      // Context zusammenstellen
      const contextParts: string[] = [];
      const citations: Array<{ documentId: string; chunkId: string; content: string }> = [];

      let currentTokens = 0;
      const tokenLimit = maxTokens;

      for (const result of searchResults) {
        // Token-Count schätzen (ca. 4 Zeichen pro Token)
        const estimatedTokens = Math.ceil(result.content.length / 4);

        if (currentTokens + estimatedTokens > tokenLimit) {
          break;
        }

        // Context-Part hinzufügen
        let contextPart = `[Document: ${result.metadata.fileName || result.documentId}]\n${result.content}`;

        if (includeMetadata && result.metadata) {
          const metadataStr = Object.entries(result.metadata)
            .filter(([key]) => !['fileName', 'fileType'].includes(key))
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

          if (metadataStr) {
            contextPart += `\n[Metadata: ${metadataStr}]`;
          }
        }

        contextParts.push(contextPart);

        // Citation hinzufügen
        citations.push({
          documentId: result.documentId || '',
          chunkId: result.chunkId,
          content: result.content.substring(0, 200), // Erste 200 Zeichen für Preview
        });

        currentTokens += estimatedTokens;
      }

      // Context zusammenfügen
      const context = contextParts.join('\n\n---\n\n');

      return {
        context,
        citations,
        tokenCount: currentTokens,
        chunksUsed: citations.length,
      };
    } catch (error: any) {
      this.logger.error(`Context building failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Context für System-Prompt formatieren
   */
  formatContextForSystemPrompt(context: string): string {
    return `Relevante Dokumente:\n\n${context}\n\nBitte verwende diese Informationen, um die Frage des Benutzers zu beantworten.`;
  }

  /**
   * Context für User-Prompt formatieren
   */
  formatContextForUserPrompt(context: string, query: string): string {
    return `Kontext:\n${context}\n\nFrage: ${query}`;
  }
}


