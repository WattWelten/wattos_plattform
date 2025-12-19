import { Injectable } from '@nestjs/common';
import { RAGProvider, RAGContext, RAGResponse } from '../rag.service';
import { F13RAGProvider } from '@wattweiser/f13';

/**
 * F13 RAG Provider Wrapper
 * 
 * Wrapper für F13 RAG Provider im Core Knowledge Layer
 */
@Injectable()
export class F13RAGProviderWrapper implements RAGProvider {
  constructor(private readonly f13RAGProvider: F13RAGProvider) {}

  async search(query: string, context: RAGContext): Promise<RAGResponse> {
    return await this.f13RAGProvider.search(query, context);
  }

  async healthCheck(): Promise<boolean> {
    return await this.f13RAGProvider.healthCheck();
  }
}

