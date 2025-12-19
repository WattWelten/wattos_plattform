import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../events/bus.service';
import { EventDomain, KnowledgeEventSchema } from '../../events/types';
import { DMSService } from '@wattweiser/dms';
import { RAGService } from '../rag/rag.service';
import { v4 as uuid } from 'uuid';

/**
 * DMS Integration Service
 * 
 * Integriert DMS mit Knowledge Layer (RAG)
 */
@Injectable()
export class DMSIntegrationService {
  private readonly logger = new Logger(DMSIntegrationService.name);

  constructor(
    private readonly dmsService: DMSService,
    private readonly ragService: RAGService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * DMS-Dokumente in Knowledge Space synchronisieren
   */
  async syncDMSToKnowledgeSpace(
    tenantId: string,
    knowledgeSpaceId: string,
    options?: {
      folderId?: string;
      updatedSince?: Date;
      autoIndex?: boolean;
    },
  ): Promise<{
    synced: number;
    failed: number;
    errors: Array<{ documentId: string; error: string }>;
  }> {
    this.logger.log(`Syncing DMS to Knowledge Space: ${knowledgeSpaceId}`, { tenantId });

    try {
      // 1. Dokumente aus DMS synchronisieren
      const syncResult = await this.dmsService.syncDocuments(tenantId, knowledgeSpaceId, {
        folderId: options?.folderId,
        updatedSince: options?.updatedSince,
      });

      // 2. Event emittieren
      const event = KnowledgeEventSchema.parse({
        id: uuid(),
        type: 'knowledge.dms.synced',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed', // Reuse existing action
        timestamp: Date.now(),
        sessionId: tenantId, // Placeholder
        tenantId,
        payload: {
          query: 'DMS sync',
          results: [],
          metadata: {
            knowledgeSpaceId,
            synced: syncResult.synced,
            failed: syncResult.failed,
          },
        },
      });

      await this.eventBus.emit(event);

      this.logger.log(`DMS sync completed for Knowledge Space: ${knowledgeSpaceId}`, syncResult);

      return syncResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`DMS sync failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * DMS-Sync-Status abrufen
   */
  getSyncStatus(tenantId: string) {
    return this.dmsService.getSyncStatus(tenantId);
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.dmsService.healthCheck();
    } catch {
      return false;
    }
  }
}

