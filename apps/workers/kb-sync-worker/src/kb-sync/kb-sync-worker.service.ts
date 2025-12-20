import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@wattweiser/db';
import { EventBusService, EventDomain } from '@wattweiser/core';
import { ApprovalWorkflowService } from './approval-workflow.service';
import { IncrementalSyncService } from './incremental-sync.service';
import { F13Client } from '@wattweiser/f13';

/**
 * KB-Sync Worker Service
 * 
 * Orchestriert automatische KB-Artikel-Synchronisation zu F13-OS
 * mit Event-basierter Kommunikation und Approval-Workflow
 */
@Injectable()
export class KBSyncWorkerService {
  private readonly logger = new Logger(KBSyncWorkerService.name);
  private readonly prisma: PrismaClient;
  private readonly maxConcurrentSyncs: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventBus: EventBusService,
    private readonly approvalWorkflow: ApprovalWorkflowService,
    private readonly incrementalSync: IncrementalSyncService,
    private readonly f13Client: F13Client,
  ) {
    this.prisma = new PrismaClient();
    this.maxConcurrentSyncs = this.configService.get<number>('KB_SYNC_MAX_CONCURRENT', 3);
    
    // Event-Listener registrieren
    this.setupEventListeners();
  }

  /**
   * Event-Listener einrichten
   */
  private setupEventListeners(): void {
    // KB-Artikel erstellt/aktualisiert Event
    this.eventBus.subscribe(`${EventDomain.KNOWLEDGE}.article.created`, async (event) => {
      await this.handleKBArticleCreated(event);
    });

    this.eventBus.subscribe(`${EventDomain.KNOWLEDGE}.article.updated`, async (event) => {
      await this.handleKBArticleUpdated(event);
    });

    // Approval Event
    this.eventBus.subscribe(`${EventDomain.KNOWLEDGE}.article.approved`, async (event) => {
      await this.handleKBArticleApproved(event);
    });
  }

  /**
   * Cron-Job: Incremental Sync für alle aktiven Tenants
   */
  @Cron('0 */6 * * *', {
    name: 'incremental-kb-sync',
    timeZone: 'Europe/Berlin',
  })
  async handleIncrementalSync() {
    this.logger.log('Starting incremental KB sync job');
    
    try {
      // Alle Tenants mit aktiviertem KB-Sync finden
      const tenants = await this.prisma.f13Config.findMany({
        where: {
          kbSyncEnabled: true,
        },
        select: {
          tenantId: true,
        },
      });

      this.logger.log(`Found ${tenants.length} tenants with KB sync enabled`);

      // Parallelisierung: Max. maxConcurrentSyncs gleichzeitig
      const chunks = this.chunkArray(tenants, this.maxConcurrentSyncs);
      
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map((config) => this.syncTenantKB(config.tenantId)),
        );
      }

      this.logger.log('Incremental KB sync job completed');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Incremental KB sync job failed: ${errorMessage}`);
    }
  }

  /**
   * KB-Artikel für einen Tenant synchronisieren
   */
  async syncTenantKB(tenantId: string): Promise<void> {
    try {
      const result = await this.incrementalSync.syncIncremental(tenantId);
      
      this.logger.log(`KB sync completed for tenant: ${tenantId}`, {
        synced: result.synced,
        failed: result.failed,
        skipped: result.skipped,
      });

      // Event emittieren
      await this.eventBus.emit({
        id: `kb-sync-${Date.now()}`,
        type: `${EventDomain.KNOWLEDGE}.sync.completed`,
        domain: EventDomain.KNOWLEDGE,
        action: 'sync.completed',
        timestamp: Date.now(),
        tenantId,
        payload: {
          synced: result.synced,
          failed: result.failed,
          skipped: result.skipped,
        },
        metadata: {
          worker: 'kb-sync-worker',
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`KB sync failed for tenant: ${errorMessage}`, errorStack, { tenantId });
    }
  }

  /**
   * KB-Artikel erstellt Event Handler
   */
  private async handleKBArticleCreated(event: any): Promise<void> {
    try {
      const { tenantId, articleId } = event.payload;
      
      this.logger.debug(`KB Article created event received`, { tenantId, articleId });

      // Prüfen ob Auto-Approve aktiviert ist
      const config = await this.prisma.f13Config.findUnique({
        where: { tenantId },
      });

      if (config?.autoApprove) {
        // Direkt synchronisieren
        await this.syncKBArticle(tenantId, articleId);
      } else {
        // Approval-Workflow starten
        await this.approvalWorkflow.requestApproval(tenantId, articleId);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to handle KB article created event: ${errorMessage}`);
    }
  }

  /**
   * KB-Artikel aktualisiert Event Handler
   */
  private async handleKBArticleUpdated(event: any): Promise<void> {
    try {
      const { tenantId, articleId } = event.payload;
      
      this.logger.debug(`KB Article updated event received`, { tenantId, articleId });

      // Prüfen ob bereits synchronisiert
      const article = await this.prisma.kBArticle.findUnique({
        where: { id: articleId },
      });

      if (article?.f13SyncStatus === 'synced' && article.status === 'published') {
        // Re-Sync wenn geändert
        await this.syncKBArticle(tenantId, articleId);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to handle KB article updated event: ${errorMessage}`);
    }
  }

  /**
   * KB-Artikel approved Event Handler
   */
  private async handleKBArticleApproved(event: any): Promise<void> {
    try {
      const { tenantId, articleId } = event.payload;
      
      this.logger.debug(`KB Article approved event received`, { tenantId, articleId });

      // Synchronisieren nach Approval
      await this.syncKBArticle(tenantId, articleId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to handle KB article approved event: ${errorMessage}`);
    }
  }

  /**
   * KB-Artikel synchronisieren
   */
  private async syncKBArticle(tenantId: string, articleId: string): Promise<void> {
    try {
      const article = await this.prisma.kBArticle.findUnique({
        where: { id: articleId },
      });

      if (!article || article.tenantId !== tenantId) {
        throw new Error(`KB Article not found: ${articleId}`);
      }

      // Status auf "syncing" setzen
      await this.prisma.kBArticle.update({
        where: { id: articleId },
        data: {
          f13SyncStatus: 'syncing',
          lastSyncedAt: new Date(),
        },
      });

      // F13-OS API: KB-Artikel erstellen/aktualisieren
      const f13Response = await this.f13Client.post('/api/v1/kb/articles', {
        title: article.title,
        content: article.contentMd,
        metadata: {
          tenantId,
          kbArticleId: article.id,
          status: article.status,
        },
      });

      const f13ArticleId = f13Response.id || f13Response.data?.id;

      // Status auf "synced" setzen
      await this.prisma.kBArticle.update({
        where: { id: articleId },
        data: {
          f13SyncStatus: 'synced',
          syncedAt: new Date(),
          kbId: f13ArticleId,
        },
      });

      this.logger.log(`KB Article synced: ${articleId} -> ${f13ArticleId}`, { tenantId });

      // Event emittieren
      await this.eventBus.emit({
        id: `kb-sync-${Date.now()}`,
        type: `${EventDomain.KNOWLEDGE}.article.synced`,
        domain: EventDomain.KNOWLEDGE,
        timestamp: Date.now(),
        tenantId,
        sessionId: `worker-${tenantId}`, // Placeholder für Worker-Events
        payload: {
          articleId,
          f13ArticleId,
        },
        metadata: {
          worker: 'kb-sync-worker',
        },
      } as any);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`KB sync failed: ${errorMessage}`, errorStack, { articleId });

      // Status auf "error" setzen
      await this.prisma.kBArticle.update({
        where: { id: articleId },
        data: {
          f13SyncStatus: 'error',
        },
      }).catch(() => {});

      // Error-Event emittieren
      await this.eventBus.emit({
        id: `kb-sync-error-${Date.now()}`,
        type: `${EventDomain.KNOWLEDGE}.article.sync.failed`,
        domain: EventDomain.KNOWLEDGE,
        timestamp: Date.now(),
        tenantId,
        sessionId: `worker-${tenantId}`, // Placeholder für Worker-Events
        payload: {
          articleId,
          error: errorMessage,
        },
        metadata: {
          worker: 'kb-sync-worker',
        },
      } as any);
    }
  }

  /**
   * Array in Chunks aufteilen
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
