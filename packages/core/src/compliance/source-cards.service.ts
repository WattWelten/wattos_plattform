import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../events/bus.service';
import { EventDomain, ComplianceEventSchema } from '../events/types';
import { ProfileService } from '../profiles/profile.service';
import { RAGResult } from '../knowledge/rag/rag.service';
import { v4 as uuid } from 'uuid';

/**
 * Source Card
 */
export interface SourceCard {
  id: string;
  content: string;
  source: string;
  score: number;
  documentName?: string | undefined;
  documentUrl?: string | undefined;
  pageNumber?: number | undefined;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Citation (für UI)
 */
export interface Citation {
  id: string;
  title: string;
  content: string;
  score: number;
  url?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Source Cards Service
 * 
 * Verwaltet Source Cards für Citations (erzwungen bei Gov)
 */
@Injectable()
export class SourceCardsService {
  private readonly logger = new Logger(SourceCardsService.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly profileService: ProfileService,
  ) {}

  /**
   * Source Cards aus RAG-Results erstellen
   */
  async createSourceCards(
    tenantId: string,
    sessionId: string,
    ragResults: RAGResult[],
  ): Promise<SourceCard[]> {
    const profile = await this.profileService.getProfile(tenantId);

    // Prüfe ob Source Cards erforderlich sind
    const required = profile.features.sourceRequired === true;

    if (!required && ragResults.length === 0) {
      return [];
    }

    // Source Cards erstellen
    const sourceCards: SourceCard[] = ragResults.map((result, index) => ({
      id: `source-${sessionId}-${index}`,
      content: result.content,
      source: result.source,
      score: result.score,
      documentName: result.metadata?.documentName || result.source,
      documentUrl: result.metadata?.documentUrl,
      pageNumber: result.metadata?.pageNumber,
      metadata: result.metadata ? (result.metadata as Record<string, unknown>) : undefined,
    }));

    // Bei Gov-Mode: Source Cards sind verpflichtend
    if (required && sourceCards.length === 0) {
      this.logger.warn(`Source cards required but no results found for tenant: ${tenantId}`);
      
      // Event emittieren für fehlende Sources
      await this.emitSourceCardsMissing(tenantId, sessionId);
    }

    // Event emittieren
    await this.emitSourceCardsCreated(tenantId, sessionId, sourceCards);

    return sourceCards;
  }

  /**
   * Source Cards validieren
   */
  async validateSourceCards(
    tenantId: string,
    sourceCards: SourceCard[],
  ): Promise<{ valid: boolean; errors: string[] }> {
    const profile = await this.profileService.getProfile(tenantId);
    const required = profile.features.sourceRequired === true;

    const errors: string[] = [];

    if (required) {
      if (sourceCards.length === 0) {
        errors.push('Source cards are required but none provided');
      }

      // Prüfe ob alle Source Cards gültig sind
      sourceCards.forEach((card, index) => {
        if (!card.content || card.content.trim().length === 0) {
          errors.push(`Source card ${index + 1}: Content is empty`);
        }
        if (!card.source || card.source.trim().length === 0) {
          errors.push(`Source card ${index + 1}: Source is empty`);
        }
        if (card.score < 0 || card.score > 1) {
          errors.push(`Source card ${index + 1}: Invalid score (must be 0-1)`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Source Cards formatieren für UI
   */
  formatSourceCardsForUI(sourceCards: SourceCard[]): Citation[] {
    return sourceCards.map((card) => ({
      id: card.id,
      title: card.documentName || card.source,
      content: card.content,
      score: card.score,
      url: card.documentUrl ?? undefined,
      metadata: {
        ...card.metadata,
        pageNumber: card.pageNumber,
      },
    }));
  }

  /**
   * Source Cards Created Event emittieren
   */
  private async emitSourceCardsCreated(
    tenantId: string,
    sessionId: string,
    sourceCards: SourceCard[],
  ): Promise<void> {
    const event = ComplianceEventSchema.parse({
      id: uuid(),
      type: `${EventDomain.COMPLIANCE}.sources.created`,
      domain: EventDomain.COMPLIANCE,
      action: 'audit.logged', // Reuse audit action
      timestamp: Date.now(),
      sessionId,
      tenantId,
      payload: {
        action: 'sources.created',
        details: {
          count: sourceCards.length,
          sources: sourceCards.map((c) => c.source),
        },
      },
    });

    await this.eventBus.emit(event);
  }

  /**
   * Source Cards Missing Event emittieren
   */
  private async emitSourceCardsMissing(
    tenantId: string,
    sessionId: string,
  ): Promise<void> {
    const event = ComplianceEventSchema.parse({
      id: uuid(),
      type: `${EventDomain.COMPLIANCE}.sources.missing`,
      domain: EventDomain.COMPLIANCE,
      action: 'audit.logged',
      timestamp: Date.now(),
      sessionId,
      tenantId,
      payload: {
        action: 'sources.missing',
        details: {
          required: true,
        },
      },
    });

    await this.eventBus.emit(event);
  }
}

