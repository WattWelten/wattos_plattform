import { Injectable, Logger } from '@nestjs/common';
import { F13Client } from '../client';
import type { RAGProvider, RAGContext, RAGResponse, RAGResult } from '@wattweiser/shared';

/**
 * F13 RAG Provider
 *
 * Adapter für F13 RAG API
 */
@Injectable()
export class F13RAGProvider implements RAGProvider {
  private readonly logger = new Logger(F13RAGProvider.name);

  constructor(private readonly f13Client: F13Client) {}

  /**
   * RAG-Suche mit Fallback-Logik
   */
  async search(
    query: string,
    context: RAGContext & {
      fallback?: () => Promise<RAGResponse>;
    }
  ): Promise<RAGResponse> {
    try {
      this.logger.debug('F13 RAG search', { query, knowledgeSpaceId: context.knowledgeSpaceId });

      try {
        // F13 RAG API Call
        const response = await this.f13Client.post('/rag/search', {
          query,
          knowledge_space_id: context.knowledgeSpaceId,
          filters: context.filters,
          top_k: context.topK || 5,
        });

        const results: RAGResult[] = (response.results || []).map((r: any) => ({
          content: r.content || r.text || '',
          score: r.score || r.similarity || 0,
          source: r.source || r.document_id || 'unknown',
          metadata: r.metadata || {},
        }));

        return {
          results,
          query,
          metadata: {
            provider: 'f13',
            knowledgeSpaceId: context.knowledgeSpaceId,
          },
        };
      } catch (f13Error: unknown) {
        const errorMessage = f13Error instanceof Error ? f13Error.message : 'Unknown error';
        this.logger.warn(`F13 RAG API call failed: ${errorMessage}`);

        // Fallback zu WattWeiser RAG Provider (wenn verfügbar)
        if (context.fallback) {
          this.logger.log('Falling back to WattWeiser RAG provider');
          return await context.fallback();
        }

        // Letzter Fallback: Leere Ergebnisse
        this.logger.warn('No fallback available, returning empty results');
        return {
          results: [],
          query,
          metadata: {
            provider: 'f13',
            knowledgeSpaceId: context.knowledgeSpaceId,
            error: 'F13 RAG temporarily unavailable',
          },
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`F13 RAG search failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // F13 RAG Health-Check implementiert
      return await this.f13Client.healthCheck();
    } catch {
      return false;
    }
  }
}
