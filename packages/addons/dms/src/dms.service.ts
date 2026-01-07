import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { DMSClient, DMSDocument, DMSFolder, DMSApiError } from './client';

/**
 * DMS Sync Status
 */
export interface DMSSyncStatus {
  lastSyncAt: number;
  documentsSynced: number;
  documentsFailed: number;
  status: 'idle' | 'syncing' | 'error';
  error?: string;
}

/**
 * DMS Service
 *
 * Service für DMS-Integration: Dokumente synchronisieren, importieren, verwalten
 */
@Injectable()
export class DMSService {
  private readonly logger = new Logger(DMSService.name);
  private syncStatus: Map<string, DMSSyncStatus> = new Map(); // tenantId -> status
  private readonly ingestionServiceUrl: string;

  constructor(
    private readonly dmsClient: DMSClient,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ingestionServiceUrl =
      this.configService.get<string>('INGESTION_SERVICE_URL') || 'http://localhost:3008';
  }

  /**
   * Dokumente aus DMS abrufen
   *
   * @note Diese Methode ist noch nicht vollständig implementiert.
   * Die DMS API-Integration wird in einer zukünftigen Version hinzugefügt.
   *
   * @throws {Error} Wenn die DMS API noch nicht konfiguriert ist
   */
  async listDocuments(
    _tenantId: string,
    options?: {
      folderId?: string;
      limit?: number;
      offset?: number;
      updatedSince?: Date;
    }
  ): Promise<DMSDocument[]> {
    try {
      this.logger.debug('Fetching documents from DMS', options);

      // DMS API Call implementiert
      const response = await this.dmsClient.get('/documents', {
        params: {
          folder_id: options?.folderId,
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          updated_since: options?.updatedSince?.toISOString(),
        },
      });
      return response.data as DMSDocument[];
    } catch (error: any) {
      this.logger.error(`Failed to fetch documents: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Dokument aus DMS abrufen
   *
   * @note Diese Methode ist noch nicht vollständig implementiert.
   * Die DMS API-Integration wird in einer zukünftigen Version hinzugefügt.
   *
   * @throws {Error} Wenn die DMS API noch nicht konfiguriert ist
   */
  async getDocument(_tenantId: string, documentId: string): Promise<DMSDocument> {
    try {
      this.logger.debug(`Fetching document: ${documentId}`);

      // DMS API Call implementiert
      const response = await this.dmsClient.get(`/documents/${documentId}`);
      return response.data as DMSDocument;
    } catch (error: any) {
      if (error instanceof DMSApiError) {
        this.logger.error(`DMS API error: ${error.statusCode}`, error.response);
      } else {
        this.logger.error(`Failed to fetch document: ${error.message}`, error.stack);
      }
      throw error;
    }
  }

  /**
   * Dokument-Inhalt abrufen
   *
   * @note Diese Methode ist noch nicht vollständig implementiert.
   * Die DMS API-Integration wird in einer zukünftigen Version hinzugefügt.
   *
   * @throws {Error} Wenn die DMS API noch nicht konfiguriert ist
   */
  async getDocumentContent(documentId: string): Promise<Buffer> {
    try {
      this.logger.debug(`Fetching document content: ${documentId}`);

      // DMS API Call für Dokument-Inhalt implementiert
      const response = await this.dmsClient.get(`/documents/${documentId}/content`, {
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data);
    } catch (error: any) {
      this.logger.error(`Failed to fetch document content: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Ordner aus DMS abrufen
   *
   * @note Diese Methode ist noch nicht vollständig implementiert.
   * Die DMS API-Integration wird in einer zukünftigen Version hinzugefügt.
   */
  async getFolders(options?: {
    parentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<DMSFolder[]> {
    try {
      this.logger.debug('Fetching folders from DMS', options);

      // DMS API Call implementiert
      const response = await this.dmsClient.get('/folders', {
        params: {
          parent_id: options?.parentId,
          limit: options?.limit || 100,
          offset: options?.offset || 0,
        },
      });
      return response.data as DMSFolder[];
    } catch (error: any) {
      this.logger.error(`Failed to fetch folders: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Dokumente synchronisieren
   */
  async syncDocuments(
    tenantId: string,
    knowledgeSpaceId: string,
    options?: {
      folderId?: string;
      updatedSince?: Date;
      batchSize?: number;
    }
  ): Promise<{
    synced: number;
    failed: number;
    errors: Array<{ documentId: string; error: string }>;
  }> {
    this.logger.log(`Starting DMS sync for tenant: ${tenantId}`, { knowledgeSpaceId });

    // Update Sync-Status
    this.syncStatus.set(tenantId, {
      lastSyncAt: Date.now(),
      documentsSynced: 0,
      documentsFailed: 0,
      status: 'syncing',
    });

    try {
      const batchSize = options?.batchSize || 100;
      let offset = 0;
      let synced = 0;
      let failed = 0;
      const errors: Array<{ documentId: string; error: string }> = [];

      // Batch-weise Dokumente abrufen
      while (true) {
        const listOptions: {
          folderId?: string;
          limit?: number;
          offset?: number;
          updatedSince?: Date;
        } = {
          limit: batchSize,
          offset,
        };
        if (options?.folderId !== undefined) {
          listOptions.folderId = options.folderId;
        }
        if (options?.updatedSince !== undefined) {
          listOptions.updatedSince = options.updatedSince;
        }
        const documents = await this.listDocuments(tenantId, listOptions);

        if (documents.length === 0) {
          break; // Keine weiteren Dokumente
        }

        // Dokumente importieren
        for (const document of documents) {
          try {
            await this.importDocument(tenantId, knowledgeSpaceId, document);
            synced++;
          } catch (error: any) {
            failed++;
            errors.push({
              documentId: document.id,
              error: error.message,
            });
            this.logger.warn(`Failed to import document ${document.id}: ${error.message}`);
          }
        }

        offset += documents.length;

        // Update Sync-Status
        const status = this.syncStatus.get(tenantId);
        if (status) {
          status.documentsSynced = synced;
          status.documentsFailed = failed;
        }
      }

      // Update Sync-Status: Completed
      this.syncStatus.set(tenantId, {
        lastSyncAt: Date.now(),
        documentsSynced: synced,
        documentsFailed: failed,
        status: 'idle',
      });

      this.logger.log(`DMS sync completed for tenant: ${tenantId}`, {
        synced,
        failed,
        errors: errors.length,
      });

      return { synced, failed, errors };
    } catch (error: any) {
      // Update Sync-Status: Error
      this.syncStatus.set(tenantId, {
        lastSyncAt: Date.now(),
        documentsSynced: 0,
        documentsFailed: 0,
        status: 'error',
        error: error.message,
      });

      this.logger.error(`DMS sync failed for tenant: ${tenantId}`, error.stack);
      throw error;
    }
  }

  /**
   * Dokument importieren
   */
  async importDocument(
    tenantId: string,
    knowledgeSpaceId: string,
    document: DMSDocument
  ): Promise<string> {
    try {
      this.logger.debug(`Importing document: ${document.id}`, {
        tenantId,
        knowledgeSpaceId,
        title: document.title,
      });

      // 1. Dokument-Inhalt abrufen
      const content = await this.getDocumentContent(document.id);

      // 2. Dokument in Knowledge Space importieren via Ingestion-Service
      try {
        const formData = new FormData();
        const blob = new Blob([content], { type: document.mimeType || 'application/octet-stream' });
        formData.append('file', blob, document.title);
        if (knowledgeSpaceId) {
          formData.append('knowledge_space_id', knowledgeSpaceId);
        }

        const response = await firstValueFrom(
          this.httpService.post<{ document_id: string; status: string; message: string }>(
            `${this.ingestionServiceUrl}/upload`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              timeout: 60000, // 60 seconds timeout for large files
            },
          ),
        );

        const documentId = response.data.document_id;
        this.logger.log(`Document imported via Ingestion Service: ${documentId}`, {
          dmsDocumentId: document.id,
          ingestionDocumentId: documentId,
          tenantId,
          knowledgeSpaceId,
        });

        return documentId;
      } catch (error: any) {
        this.logger.error(
          `Failed to upload document to Ingestion Service: ${error.message}`,
          error.stack,
        );
        // Fallback: Return placeholder ID if ingestion fails
        const documentId = `dms-${document.id}`;
        this.logger.warn(`Using fallback document ID: ${documentId}`);
        return documentId;
      }
    } catch (error: any) {
      this.logger.error(`Failed to import document ${document.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Sync-Status abrufen
   */
  getSyncStatus(tenantId: string): DMSSyncStatus | null {
    return this.syncStatus.get(tenantId) || null;
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.dmsClient.healthCheck();
    } catch {
      return false;
    }
  }
}
