import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../events/bus.service';
import { Agent } from '../orchestrator/runtime.service';
import { Event, EventDomain, KnowledgeEvent, KnowledgeEventSchema } from '../events/types';
import { RAGService } from '../knowledge/rag/rag.service';
import { v4 as uuid } from 'uuid';

/**
 * Retrieval Agent
 * 
 * Verarbeitet Knowledge-Events, führt RAG-Suchen durch, baut Context auf
 */
@Injectable()
export class RetrievalAgent implements Agent {
  readonly name = 'retrieval-agent';
  readonly version = '1.0.0';
  private readonly logger = new Logger(RetrievalAgent.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly ragService: RAGService,
  ) {}

  /**
   * Event verarbeiten
   */
  async handle(event: Event): Promise<Event | null> {
    // Nur Knowledge-Events verarbeiten
    if (event.domain !== EventDomain.KNOWLEDGE) {
      return null;
    }

    try {
      const knowledgeEvent = KnowledgeEventSchema.parse(event);
      this.logger.debug(`Processing knowledge event: ${knowledgeEvent.action}`, {
        sessionId: knowledgeEvent.sessionId,
        tenantId: knowledgeEvent.tenantId,
      });

      switch (knowledgeEvent.action) {
        case 'search.executed':
          return await this.handleSearchExecuted(knowledgeEvent);
        case 'context.built':
          return await this.handleContextBuilt(knowledgeEvent);
        case 'citation.generated':
          return await this.handleCitationGenerated(knowledgeEvent);
        default:
          this.logger.warn(`Unknown knowledge action: ${knowledgeEvent.action}`);
          return null;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing knowledge event: ${errorMessage}`, errorStack);
      return null;
    }
  }

  /**
   * RAG-Suche ausführen
   */
  private async handleSearchExecuted(event: KnowledgeEvent): Promise<Event | null> {
    const { sessionId, tenantId, payload } = event;
    const query = payload.query;

    if (!query) {
      this.logger.warn('RAG search executed without query');
      return null;
    }

    this.logger.debug(`Executing RAG search: ${query.substring(0, 50)}...`);

    try {
      // RAG-Suche durchführen
      const ragResponse = await this.ragService.search(query, {
        tenantId,
        topK: 5,
      });

      // Context-Event emittieren
      const contextEvent: KnowledgeEvent = {
        id: uuid(),
        type: `${EventDomain.KNOWLEDGE}.context.built`,
        domain: EventDomain.KNOWLEDGE,
        action: 'context.built',
        timestamp: Date.now(),
        sessionId,
        tenantId,
        userId: event.userId,
        payload: {
          query,
          results: ragResponse.results,
          context: ragResponse.results.map((r) => r.content).join('\n\n'),
          citations: ragResponse.results.map((r) => ({
            content: r.content,
            source: r.source,
            score: r.score,
            metadata: r.metadata,
          })),
        },
        metadata: {
          agent: this.name,
          version: this.version,
        },
      };

      await this.eventBus.emit(contextEvent);

      return contextEvent;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`RAG search failed: ${errorMessage}`, errorStack);

      // Error-Event emittieren
      const errorEvent: KnowledgeEvent = {
        id: uuid(),
        type: `${EventDomain.KNOWLEDGE}.search.failed`,
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId,
        tenantId,
        userId: event.userId,
        payload: {
          query,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        metadata: {
          agent: this.name,
          version: this.version,
          error: true,
        },
      };

      await this.eventBus.emit(errorEvent);
      return errorEvent;
    }
  }

  /**
   * Context aufgebaut
   */
  private async handleContextBuilt(event: KnowledgeEvent): Promise<Event | null> {
    // Context wurde bereits aufgebaut, Event weiterleiten
    return event;
  }

  /**
   * Citation generiert
   */
  private async handleCitationGenerated(event: KnowledgeEvent): Promise<Event | null> {
    // Citation wurde bereits generiert, Event weiterleiten
    return event;
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.ragService.healthCheck();
    } catch {
      return false;
    }
  }
}

