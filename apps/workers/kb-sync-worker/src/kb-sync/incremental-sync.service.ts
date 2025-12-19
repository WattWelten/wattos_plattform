import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { F13Client } from '@wattweiser/f13';

/**
 * Incremental Sync Service
 * 
 * Optimierte Incremental Synchronisation mit Hash-Vergleich
 */
@Injectable()
export class IncrementalSyncService {
  private readonly logger = new Logger(IncrementalSyncService.name);
  private readonly prisma: PrismaClient;

  constructor(private readonly f13Client: F13Client) {
    this.prisma = new PrismaClient();
  }

  /**
   * Incremental Sync für einen Tenant
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
      const articlesToSync = await this.getArticlesToSync(tenantId, config.autoApprove);

      let synced = 0;
      let failed = 0;
      let skipped = 0;

      // Batch-Processing für Performance
      const batchSize = 10;
      for (let i = 0; i < articlesToSync.length; i += batchSize) {
        const batch = articlesToSync.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map((article) => this.syncArticle(tenantId, article.id, config.autoApprove)),
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            if (result.value === 'synced') {
              synced++;
            } else if (result.value === 'skipped') {
              skipped++;
            } else {
              failed++;
            }
          } else {
            failed++;
          }
        }
      }

      this.logger.log(`Incremental KB sync completed for tenant: ${tenantId}`, {
        synced,
        failed,
        skipped,
        total: articlesToSync.length,
      });

      return { synced, failed, skipped };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Incremental KB sync failed: ${errorMessage}`, errorStack, { tenantId });
      throw error;
    }
  }

  /**
   * Artikel finden, die synchronisiert werden müssen
   */
  private async getArticlesToSync(
    tenantId: string,
    autoApprove: boolean,
  ): Promise<Array<{ id: string; title: string }>> {
    // MVP: Vereinfachte Query mit In-Memory-Filterung
    const allArticles = await this.prisma.kBArticle.findMany({
      where: {
        tenantId,
        status: autoApprove ? 'published' : 'approved',
      },
      select: {
        id: true,
        title: true,
        f13SyncStatus: true,
        updatedAt: true,
        syncedAt: true,
      },
      take: 200, // Größerer Batch für Filterung
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // In-Memory-Filterung für komplexe Logik
    const articles = allArticles
      .filter((article) => {
        // Nicht synchronisiert
        if (!article.f13SyncStatus || article.f13SyncStatus === 'pending' || article.f13SyncStatus === 'error') {
          return true;
        }
        
        // Geändert seit letztem Sync
        if (article.f13SyncStatus === 'synced' && article.syncedAt) {
          return article.updatedAt > article.syncedAt;
        }
        
        return false;
      })
      .slice(0, 100) // Limit auf 100
      .map((article) => ({
        id: article.id,
        title: article.title,
      }));

    // Prüfe auch geänderte Artikel (wenn syncedAt vorhanden)
    const articles = await this.prisma.kBArticle.findMany({
      where: {
        ...where,
        OR: [
          ...where.OR,
          {
            AND: [
              { f13SyncStatus: 'synced' },
              { updatedAt: { gt: this.prisma.kBArticle.fields.syncedAt } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
      },
      take: 100, // Batch-Größe
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return articles;
  }

  /**
   * Einzelnen Artikel synchronisieren
   */
  private async syncArticle(
    tenantId: string,
    articleId: string,
    autoApprove: boolean,
  ): Promise<'synced' | 'failed' | 'skipped'> {
    try {
      const article = await this.prisma.kBArticle.findUnique({
        where: { id: articleId },
      });

      if (!article || article.tenantId !== tenantId) {
        return 'skipped';
      }

      // Approval-Check
      if (!autoApprove && article.status !== 'approved') {
        return 'skipped';
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

      return 'synced';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to sync article ${articleId}: ${errorMessage}`);

      // Status auf "error" setzen
      await this.prisma.kBArticle.update({
        where: { id: articleId },
        data: {
          f13SyncStatus: 'error',
        },
      }).catch(() => {});

      return 'failed';
    }
  }
}

