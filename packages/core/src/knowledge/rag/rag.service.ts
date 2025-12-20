import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../events/bus.service';
import { EventDomain, KnowledgeEventSchema } from '../../events/types';
import { v4 as uuid } from 'uuid';

/**
 * RAG Provider Interface
 */
export interface RAGProvider {
  search(query: string, context: RAGContext): Promise<RAGResponse>;
  healthCheck(): Promise<boolean>;
}

/**
 * RAG Context
 */
export interface RAGContext {
  knowledgeSpaceId?: string;
  tenantId: string;
  filters?: Record<string, any>;
  topK?: number;
}

/**
 * RAG Response
 */
export interface RAGResponse {
  results: RAGResult[];
  query: string;
  metadata?: Record<string, any>;
}

/**
 * RAG Result
 */
export interface RAGResult {
  content: string;
  score: number;
  source: string;
  metadata?: Record<string, any>;
}

/**
 * RAG Service
 * 
 * Provider-agnostischer RAG-Service
 */
@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);
  private providers: Map<string, RAGProvider> = new Map();
  private defaultProvider: string = 'wattweiser';

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * RAG Provider registrieren
   */
  registerProvider(name: string, provider: RAGProvider): void {
    this.providers.set(name, provider);
    this.logger.log(`RAG Provider registered: ${name}`);
  }

  /**
   * Provider entfernen
   */
  unregisterProvider(name: string): void {
    this.providers.delete(name);
    this.logger.log(`RAG Provider unregistered: ${name}`);
  }

  /**
   * Provider abrufen
   */
  getProvider(name: string): RAGProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Standard-Provider setzen
   */
  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`RAG Provider not found: ${name}`);
    }
    this.defaultProvider = name;
    this.logger.log(`Default RAG Provider set to: ${name}`);
  }

  /**
   * RAG-Suche durchführen
   */
  async search(
    query: string,
    context: RAGContext,
    providerName?: string,
  ): Promise<RAGResponse> {
    const provider = providerName
      ? this.providers.get(providerName)
      : this.providers.get(this.defaultProvider);

    if (!provider) {
      throw new Error(`RAG Provider not found: ${providerName || this.defaultProvider}`);
    }

    this.logger.debug(`RAG search: ${query}`, { provider: providerName || this.defaultProvider });

    try {
      const response = await provider.search(query, context);

      // Emit Knowledge Event
      // Session-ID aus Context oder generieren
      const sessionId = (context as any).sessionId || uuid();
      const event = KnowledgeEventSchema.parse({
        id: uuid(),
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId,
        tenantId: context.tenantId,
        payload: {
          query,
          results: response.results,
        },
      });

      await this.eventBus.emit(event);

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`RAG search failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Context aufbauen
   */
  async buildContext(
    query: string,
    context: RAGContext,
    providerName?: string,
  ): Promise<string> {
    const response = await this.search(query, context, providerName);

    // Baue Context aus Top-Results
    const contextText = response.results
      .slice(0, context.topK || 5)
      .map((result, index) => `[${index + 1}] ${result.content} (Source: ${result.source})`)
      .join('\n\n');

    // Emit Context Event
    const event = KnowledgeEventSchema.parse({
      id: uuid(),
      type: 'knowledge.context.built',
      domain: EventDomain.KNOWLEDGE,
      action: 'context.built',
      timestamp: Date.now(),
      sessionId: context.tenantId,
      tenantId: context.tenantId,
      payload: {
        query,
        context: contextText,
      },
    });

    await this.eventBus.emit(event);

    return contextText;
  }

  /**
   * Citations generieren
   */
  generateCitations(results: RAGResult[]): Array<{ content: string; source: string; score: number }> {
    return results.map((result) => ({
      content: result.content,
      source: result.source,
      score: result.score,
    }));
  }
}

