import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { EventBusService, Event, EventDomain } from '@wattweiser/core';
import { DMSService } from './dms.service';

/**
 * DMS Sync Service
 * 
 * Verwaltet vollständige Sync-Funktionalität mit Error-Recovery
 * und Integration mit Ingestion-Service
 */
@Injectable()
export class DMSSyncService {
  private readonly logger = new Logger(DMSSyncService.name);
  private readonly prisma: PrismaClient;
  private readonly syncQueue: Map<string, Promise<void>> = new Map();

  constructor(
    private readonly dmsService: DMSService,
    private readonly eventBus: EventBusService,
  ) {
    this.prisma = new PrismaClient();
    this.setupEventSubscriptions();
  }

  /**
   * Event-Subscriptions einrichten
   */
  private setupEventSubscriptions(): void {
    // DMS Document Created Event
    this.eventBus.subscribe('dms.document.created', async (event: Event) => {
      const { tenantId, documentId } = event.payload as { tenantId: string; documentId: string };
      await this.syncDocument(tenantId, documentId);
    });

    // DMS Document Updated Event
    this.eventBus.subscribe('dms.document.updated', async (event: Event) => {
      const { tenantId, documentId } = event.payload as { tenantId: string; documentId: string };
      await this.syncDocument(tenantId, documentId);
    });

    // DMS Document Deleted Event
    this.eventBus.subscribe('dms.document.deleted', async (event: Event) => {
      const { tenantId, documentId } = event.payload as { tenantId: string; documentId: string };
      await this.handleDocumentDeletion(tenantId, documentId);
    });
  }

  /**
   * Vollständige Sync-Funktionalität
   */
  async syncAllDocuments(tenantId: string): Promise<void> {
    this.logger.log(`Starting full sync for tenant: ${tenantId}`);

    try {
      const documents = await this.dmsService.listDocuments(tenantId);
      
      // Batch-Processing: 10 Dokumente gleichzeitig
      const batchSize = 10;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        await Promise.all(
          batch.map((doc) => this.syncDocument(tenantId, doc.id)),
        );
      }

      this.logger.log(`Full sync completed for tenant: ${tenantId}, ${documents.length} documents`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Full sync failed for tenant: ${tenantId}`, errorMessage);
      throw error;
    }
  }

  /**
   * Incremental Sync
   */
  async syncIncremental(tenantId: string, lastSyncAt?: Date): Promise<void> {
    this.logger.log(`Starting incremental sync for tenant: ${tenantId}`, {
      lastSyncAt,
    });

    try {
      const since = lastSyncAt || await this.getLastSyncTime(tenantId);
      // MVP: listDocuments unterstützt noch kein modifiedSince, daher alle Dokumente
      const documents = await this.dmsService.listDocuments(tenantId);
      
      // Filter nach modifiedSince (wenn vorhanden)
      const filteredDocuments = since
        ? documents.filter((doc) => {
            const modifiedAt = doc.metadata?.modifiedAt || doc.metadata?.updatedAt;
            return modifiedAt && new Date(modifiedAt) > since;
          })
        : documents;

      if (documents.length === 0) {
        this.logger.debug(`No documents to sync for tenant: ${tenantId}`);
        return;
      }

      if (filteredDocuments.length === 0) {
        this.logger.debug(`No documents to sync for tenant: ${tenantId}`);
        return;
      }

      // Batch-Processing
      const batchSize = 10;
      for (let i = 0; i < filteredDocuments.length; i += batchSize) {
        const batch = filteredDocuments.slice(i, i + batchSize);
        await Promise.all(
          batch.map((doc) => this.syncDocument(tenantId, doc.id)),
        );
      }

      // Last sync time aktualisieren
      await this.updateLastSyncTime(tenantId);

      this.logger.log(
        `Incremental sync completed for tenant: ${tenantId}, ${filteredDocuments.length} documents`,
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Incremental sync failed for tenant: ${tenantId}`,
        errorMessage,
      );
      throw error;
    }
  }

  /**
   * Einzelnes Dokument synchronisieren
   */
  async syncDocument(tenantId: string, documentId: string): Promise<void> {
    const syncKey = `${tenantId}:${documentId}`;

    // Verhindere doppelte Syncs
    if (this.syncQueue.has(syncKey)) {
      this.logger.debug(`Sync already in progress: ${syncKey}`);
      return this.syncQueue.get(syncKey);
    }

    const syncPromise = this.syncDocumentWithRetry(tenantId, documentId);
    this.syncQueue.set(syncKey, syncPromise);

    try {
      await syncPromise;
    } finally {
      this.syncQueue.delete(syncKey);
    }
  }

  /**
   * Dokument mit Retry-Logik synchronisieren
   */
  private async syncDocumentWithRetry(
    tenantId: string,
    documentId: string,
    maxRetries = 3,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Dokument von DMS abrufen
        const document = await this.dmsService.getDocument(tenantId, documentId);
        if (!document) {
          this.logger.warn(`Document not found: ${documentId}`);
          return;
        }

        // Dokument an Ingestion-Service senden
        await this.sendToIngestion(tenantId, {
          id: document.id,
          name: document.name || documentId,
          content: document.content || '',
          metadata: document.metadata || {},
        });

        // Sync-Status in DB aktualisieren
        await this.updateSyncStatus(tenantId, documentId, 'synced');

        this.logger.debug(
          `Document synced successfully: ${documentId} (attempt ${attempt})`,
        );
        return;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        this.logger.warn(
          `Sync attempt ${attempt} failed for document: ${documentId}`,
          lastError.message,
        );

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Alle Retries fehlgeschlagen
    await this.updateSyncStatus(tenantId, documentId, 'error', lastError?.message);
    throw lastError || new Error('Sync failed after all retries');
  }

  /**
   * Dokument an Ingestion-Service senden
   */
  private async sendToIngestion(
    tenantId: string,
    document: {
      id: string;
      name: string;
      content: string;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    // MVP: Event-basierte Integration mit Ingestion-Service
    const event: Event = {
      id: `ingest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ingestion.document.ready',
      domain: EventDomain.KNOWLEDGE,
      action: 'document.ready',
      timestamp: Date.now(),
      tenantId,
      payload: {
        documentId: document.id,
        name: document.name,
        content: document.content,
        metadata: document.metadata || {},
        source: 'dms',
      },
    };
    await this.eventBus.emit(event);

    this.logger.debug(`Document sent to ingestion: ${document.id}`);
  }

  /**
   * Dokument-Löschung behandeln
   */
  private async handleDocumentDeletion(
    tenantId: string,
    documentId: string,
  ): Promise<void> {
    this.logger.log(`Handling document deletion: ${documentId}`);

    try {
      // Event an Ingestion-Service senden
      const event: Event = {
        id: `delete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ingestion.document.deleted',
        domain: EventDomain.KNOWLEDGE,
        action: 'document.deleted',
        timestamp: Date.now(),
        tenantId,
        payload: {
          documentId,
          source: 'dms',
        },
      };
      await this.eventBus.emit(event);

      // Sync-Status entfernen
      await this.removeSyncStatus(tenantId, documentId);

      this.logger.debug(`Document deletion handled: ${documentId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to handle document deletion: ${documentId}`,
        errorMessage,
      );
      throw error;
    }
  }

  /**
   * Last sync time abrufen
   */
  private async getLastSyncTime(tenantId: string): Promise<Date | undefined> {
    // MVP: Aus Tenant-Settings oder separater Sync-Status-Tabelle
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    if (tenant?.settings && typeof tenant.settings === 'object') {
      const settings = tenant.settings as any;
      if (settings.dmsLastSyncAt) {
        return new Date(settings.dmsLastSyncAt);
      }
    }

    return undefined;
  }

  /**
   * Last sync time aktualisieren
   */
  private async updateLastSyncTime(tenantId: string): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...((await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { settings: true },
          }))?.settings as any || {}),
          dmsLastSyncAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Sync-Status aktualisieren
   */
  private async updateSyncStatus(
    tenantId: string,
    documentId: string,
    status: 'syncing' | 'synced' | 'error',
    errorMessage?: string,
  ): Promise<void> {
    // MVP: Sync-Status in KnowledgeSpace oder separater Tabelle
    // Für MVP: Logging
    this.logger.debug(`Sync status updated: ${documentId} -> ${status}`, {
      tenantId,
      documentId,
      status,
      errorMessage,
    });
  }

  /**
   * Sync-Status entfernen
   */
  private async removeSyncStatus(
    tenantId: string,
    documentId: string,
  ): Promise<void> {
    // MVP: Sync-Status entfernen
    this.logger.debug(`Sync status removed: ${documentId}`, {
      tenantId,
      documentId,
    });
  }

  /**
   * Error-Recovery: Fehlgeschlagene Syncs erneut versuchen
   */
  async recoverFailedSyncs(tenantId: string): Promise<void> {
    this.logger.log(`Recovering failed syncs for tenant: ${tenantId}`);

    // MVP: Fehlgeschlagene Syncs aus DB abrufen
    // Für MVP: Placeholder
    this.logger.debug('Error recovery not yet fully implemented');
  }
}

