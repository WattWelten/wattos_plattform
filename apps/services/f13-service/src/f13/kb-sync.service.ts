import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { F13Client } from '@wattweiser/f13';

/**
 * KB-Sync Service
 * 
 * Synchronisiert KB-Artikel zu F13-OS mit Incremental Sync und Approval-Workflow
 */
@Injectable()
export class KBSyncService {
  private readonly logger = new Logger(KBSyncService.name);
  private readonly prisma: PrismaClient;

  constructor(
    private readonly f13Client: F13Client,
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * KB-Artikel zu F13-OS synchronisieren
   */
  async syncKBArticleToF13(
    tenantId: string,
    kbArticleId: string,
    options?: {
      autoApprove?: boolean;
    },
  ): Promise<{
    success: boolean;
    f13ArticleId?: string;
    status: string;
  }> {
    try {
      const article = await this.prisma.kBArticle.findUnique({
        where: { id: kbArticleId },
      });

      if (!article || article.tenantId !== tenantId) {
        throw new Error(`KB Article not found: ${kbArticleId}`);
      }

      // Prüfen ob bereits synchronisiert
      if (article.f13SyncStatus === 'synced' && article.syncedAt) {
        this.logger.debug(`KB Article already synced: ${kbArticleId}`);
        return {
          success: true,
          f13ArticleId: article.kbId,
          status: 'synced',
        };
      }

      // Status auf "syncing" setzen
      await this.prisma.kBArticle.update({
        where: { id: kbArticleId },
        data: {
          f13SyncStatus: 'syncing',
          lastSyncedAt: new Date(),
        },
      });

      // F13-OS API: KB-Artikel erstellen/aktualisieren
      // Verwende F13 Client direkt für konsistente Base-URL und Error-Handling
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
        where: { id: kbArticleId },
        data: {
          f13SyncStatus: 'synced',
          syncedAt: new Date(),
          kbId: f13ArticleId, // F13-OS ID speichern
        },
      });

      this.logger.log(`KB Article synced to F13-OS: ${kbArticleId} -> ${f13ArticleId}`);

      return {
        success: true,
        f13ArticleId,
        status: 'synced',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`KB sync failed: ${errorMessage}`, errorStack, { kbArticleId });

      // Status auf "error" setzen
      await this.prisma.kBArticle.update({
        where: { id: kbArticleId },
        data: {
          f13SyncStatus: 'error',
        },
      }).catch(() => {});

      return {
        success: false,
        status: 'error',
      };
    }
  }

  /**
   * Incremental Sync: Nur geänderte Artikel synchronisieren
   */
  async syncIncremental(tenantId: string): Promise<{
    synced: number;
    failed: number;
    skipped: number;
  }> {
    try {
      const config = await this.prisma.f13Config.findUnique({
        where: { tenantId },
      });

      if (!config || !config.kbSyncEnabled) {
        this.logger.debug(`KB sync disabled for tenant: ${tenantId}`);
        return { synced: 0, failed: 0, skipped: 0 };
      }

      // Artikel finden, die synchronisiert werden müssen
      const articlesToSync = await this.prisma.kBArticle.findMany({
        where: {
          tenantId,
          status: 'published',
          OR: [
            { f13SyncStatus: null },
            { f13SyncStatus: 'pending' },
            { f13SyncStatus: 'error' },
            {
              AND: [
                { f13SyncStatus: 'synced' },
                { updatedAt: { gt: this.prisma.kBArticle.fields.syncedAt } },
              ],
            },
          ],
        },
        take: 100, // Batch-Größe
      });

      let synced = 0;
      let failed = 0;
      let skipped = 0;

      for (const article of articlesToSync) {
        // Approval-Workflow (wenn nicht auto-approve)
        if (!config.autoApprove && article.status !== 'approved') {
          skipped++;
          continue;
        }

        const result = await this.syncKBArticleToF13(tenantId, article.id, {
          autoApprove: config.autoApprove,
        });

        if (result.success) {
          synced++;
        } else {
          failed++;
        }
      }

      this.logger.log(`Incremental KB sync completed`, {
        tenantId,
        synced,
        failed,
        skipped,
      });

      return { synced, failed, skipped };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Incremental KB sync failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Health Check
   */
  async healthCheck(tenantId: string): Promise<boolean> {
    try {
      const config = await this.prisma.f13Config.findUnique({
        where: { tenantId },
      });

      if (!config) {
        return false;
      }

      // F13-OS Health Check
      return await this.f13Client.healthCheck();
    } catch {
      return false;
    }
  }
}

