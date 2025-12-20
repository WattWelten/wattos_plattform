import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ServiceDiscoveryService } from '@wattweiser/shared';
import * as crypto from 'crypto';

/**
 * Incremental Crawl Service
 * 
 * Unterstützt Incremental Crawling: Nur geänderte Seiten werden gecrawlt
 */
@Injectable()
export class IncrementalCrawlService {
  private readonly logger = new Logger(IncrementalCrawlService.name);
  private readonly prisma: PrismaClient;

  constructor(
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Incremental Crawling durchführen
   */
  async crawlIncremental(job: {
    id: string;
    tenantId: string;
    characterId: string | null;
    urls: string[];
    config: Record<string, unknown>;
  }): Promise<void> {
    this.logger.log(`Starting incremental crawl for job: ${job.id}`, {
      urlsCount: job.urls.length,
    });

    const crawlerServiceUrl = this.serviceDiscovery.getServiceUrl('crawler-service', 3015);

    // Für jede URL prüfen ob sie geändert wurde
    for (const url of job.urls) {
      const hasChanged = await this.hasUrlChanged(url, job.tenantId);
      
      if (hasChanged) {
        this.logger.debug(`URL changed, crawling: ${url}`);
        await this.crawlUrl(url, job.tenantId, job.characterId || undefined, crawlerServiceUrl);
      } else {
        this.logger.debug(`URL unchanged, skipping: ${url}`);
      }
    }
  }

  /**
   * Prüfen ob URL geändert wurde
   */
  private async hasUrlChanged(url: string, tenantId: string): Promise<boolean> {
    try {
      // Hash der aktuellen Seite berechnen
      const currentHash = await this.getUrlHash(url);
      
      // Gespeicherten Hash abrufen (aus Document-Metadaten oder separater Tabelle)
      const storedHash = await this.getStoredHash(url, tenantId);
      
      // Wenn kein Hash gespeichert ist, wurde die Seite noch nicht gecrawlt
      if (!storedHash) {
        return true;
      }
      
      // Wenn Hash unterschiedlich, wurde die Seite geändert
      return currentHash !== storedHash;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to check URL change: ${errorMessage}`, { url });
      // Bei Fehler: Seite crawlen (sicherer Ansatz)
      return true;
    }
  }

  /**
   * Hash einer URL berechnen
   */
  private async getUrlHash(url: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 30000,
          maxRedirects: 5,
        }),
      );

      const content = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);
      
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to get URL hash: ${errorMessage}`, { url });
      throw error;
    }
  }

  /**
   * Gespeicherten Hash abrufen
   */
  private async getStoredHash(url: string, tenantId: string): Promise<string | null> {
    // MVP: Hash aus Document-Metadaten abrufen
    // Später: Separates Hash-Storage-System
    try {
      const documents = await this.prisma.document.findMany({
        where: {
          knowledgeSpace: {
            tenantId,
          },
        },
        include: {
          knowledgeSpace: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 100, // Limit für Performance
      });

      // In-Memory-Filterung nach sourceUrl (da Prisma JSON-Filtering limitiert ist)
      const document = documents.find((doc) => {
        const metadata = doc.metadata as Record<string, unknown>;
        return metadata.sourceUrl === url;
      });

      if (document && document.metadata) {
        const metadata = document.metadata as Record<string, unknown>;
        return (metadata.contentHash as string) || null;
      }

      return null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to get stored hash: ${errorMessage}`, { url });
      return null;
    }
  }

  /**
   * URL crawlen
   */
  private async crawlUrl(
    url: string,
    tenantId: string,
    characterId: string | undefined,
    crawlerServiceUrl: string,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${crawlerServiceUrl}/api/v1/crawler/start`, {
          url,
          tenantId,
          characterId,
          maxDepth: 3,
          maxPages: 100,
          allowedDomains: [new URL(url).hostname],
        }),
      );

      this.logger.debug(`Crawled URL: ${url}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to crawl URL ${url}: ${errorMessage}`);
    }
  }
}
