import { Injectable, Logger } from '@nestjs/common';
import { F13RAGProvider } from '@wattweiser/f13';
import { RAGContext, RAGResponse } from '@wattweiser/core';

/**
 * F13 RAG Service
 * 
 * RAG-Suche in F13 Knowledge Base
 */
@Injectable()
export class F13RAGService {
  private readonly logger = new Logger(F13RAGService.name);

  constructor(private readonly f13RAGProvider: F13RAGProvider) {}

  /**
   * RAG-Suche in F13 Knowledge Base
   */
  async search(
    query: string,
    context: RAGContext,
  ): Promise<RAGResponse> {
    try {
      this.logger.debug(`F13 RAG search`, {
        query: query.substring(0, 50),
        knowledgeSpaceId: context.knowledgeSpaceId,
      });

      return await this.f13RAGProvider.search(query, context);
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
    return await this.f13RAGProvider.healthCheck();
  }
}

