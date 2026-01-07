import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { v4 as uuidv4 } from 'uuid';
import { CrawlerEngineService } from './crawler-engine.service';
import { CrawlResult, CrawledPage } from './interfaces/crawled-page.interface';
import { StartCrawlDto } from './dto/start-crawl.dto';
import { firstValueFrom } from 'rxjs';
import { ServiceDiscoveryService } from '@wattweiser/shared';
import { PrismaService } from '@wattweiser/db';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly crawlResults: Map<string, CrawlResult> = new Map();
  private readonly maxDepth: number;
  private readonly maxPages: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly crawlerEngine: CrawlerEngineService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
    private readonly prisma: PrismaService,
  ) {
    this.maxDepth = this.configService.get<number>('crawler.maxDepth', 3);
    this.maxPages = this.configService.get<number>('crawler.maxPages', 100);
  }

  /**
   * Crawl starten
   */
  async startCrawl(dto: StartCrawlDto): Promise<CrawlResult> {
    const crawlId = uuidv4();
    const maxDepth = dto.maxDepth ?? this.maxDepth;
    const maxPages = dto.maxPages ?? this.maxPages;

    const crawlResult: CrawlResult = {
      id: crawlId,
      tenantId: dto.tenantId,
      startUrl: dto.url,
      status: 'running',
      pages: [],
      totalPages: 0,
      crawledPages: 0,
      failedPages: 0,
      startedAt: new Date(),
    };

    this.crawlResults.set(crawlId, crawlResult);
    this.logger.log(`Starting crawl ${crawlId} for ${dto.url}`);

    // Asynchron crawlen
    this.performCrawl(crawlId, dto, maxDepth, maxPages).catch((error) => {
      this.logger.error(`Crawl ${crawlId} failed: ${error.message}`);
      const result = this.crawlResults.get(crawlId);
      if (result) {
        result.status = 'failed';
        result.error = error.message;
        result.completedAt = new Date();
      }
    });

    return crawlResult;
  }

  /**
   * Crawl durchführen
   */
  private async performCrawl(
    crawlId: string,
    dto: StartCrawlDto,
    maxDepth: number,
    maxPages: number,
  ): Promise<void> {
    const visitedUrls = new Set<string>();
    const queue: Array<{ url: string; depth: number }> = [{ url: dto.url, depth: 0 }];
    const result = this.crawlResults.get(crawlId)!;

    // Basis-Domain für allowedDomains bestimmen
    const baseUrl = new URL(dto.url);
    const allowedDomains = dto.allowedDomains || [baseUrl.hostname];

    while (queue.length > 0 && result.crawledPages < maxPages) {
      const { url, depth } = queue.shift()!;

      // URL normalisieren
      const normalizedUrl = this.crawlerEngine.normalizeUrl(url, dto.url);
      if (!normalizedUrl || visitedUrls.has(normalizedUrl)) {
        continue;
      }

      // Prüfen ob URL erlaubt ist
      if (!this.crawlerEngine.isUrlAllowed(normalizedUrl, allowedDomains, dto.excludePaths)) {
        continue;
      }

      // Tiefe-Prüfung
      if (depth > maxDepth) {
        continue;
      }

      visitedUrls.add(normalizedUrl);

      // Delta-Crawl: Prüfe ob Seite geändert wurde
      if (dto.deltaCrawl && !dto.reindex) {
        const existingHash = await this.getStoredHash(normalizedUrl, dto.tenantId);
        if (existingHash) {
          // Seite crawlen und Hash vergleichen
          const page = await this.crawlerEngine.crawlPage(normalizedUrl, depth);
          if (page && page.hash === existingHash) {
            // Seite unverändert, überspringen
            this.logger.debug(`Page unchanged (delta crawl): ${normalizedUrl}`);
            continue;
          }
          // Seite geändert oder neu, weiter verarbeiten
        }
      }

      // Seite crawlen
      const page = await this.crawlerEngine.crawlPage(normalizedUrl, depth);
      if (page) {
        // Hash speichern für Delta-Crawl
        if (page.hash) {
          await this.storeHash(normalizedUrl, page.hash, dto.tenantId);
        }

        result.pages.push(page);
        result.crawledPages++;

        // Links zur Queue hinzufügen (wenn noch Platz)
        if (depth < maxDepth && result.crawledPages < maxPages) {
          for (const link of page.links) {
            const normalizedLink = this.crawlerEngine.normalizeUrl(link, dto.url);
            if (normalizedLink && !visitedUrls.has(normalizedLink)) {
              queue.push({ url: normalizedLink, depth: depth + 1 });
            }
          }
        }

        // Webhook an Customer Intelligence Service senden
        await this.sendWebhook(dto.tenantId, page);
      } else {
        result.failedPages++;
      }

      result.totalPages = visitedUrls.size;
    }

    result.status = 'completed';
    result.completedAt = new Date();
    this.logger.log(`Crawl ${crawlId} completed: ${result.crawledPages} pages crawled`);
  }

  /**
   * Webhook an Customer Intelligence Service senden
   */
  private async sendWebhook(tenantId: string, page: CrawledPage): Promise<void> {
    try {
      const customerIntelligenceUrl = this.serviceDiscovery.getServiceUrl('customer-intelligence-service', 3014);

      await firstValueFrom(
        this.httpService.post(`${customerIntelligenceUrl}/webhooks/crawler/data`, {
          tenantId,
          url: page.url,
          title: page.title,
          content: page.content,
          language: page.metadata.language,
          metadata: page.metadata,
          crawledAt: page.crawledAt,
        }),
      );

      this.logger.debug(`Webhook sent for page: ${page.url}`);
    } catch (error: any) {
      this.logger.warn(`Failed to send webhook: ${error.message}`);
      // Webhook-Fehler sind nicht kritisch, Crawl kann fortgesetzt werden
    }
  }

  /**
   * Crawl-Status abrufen
   */
  getCrawlStatus(crawlId: string): CrawlResult | null {
    return this.crawlResults.get(crawlId) || null;
  }

  /**
   * Alle Crawls für Tenant abrufen
   */
  getCrawlsForTenant(tenantId: string): CrawlResult[] {
    return Array.from(this.crawlResults.values()).filter(crawl => crawl.tenantId === tenantId);
  }

  /**
   * Gespeicherten Hash für URL abrufen
   */
  private async getStoredHash(url: string, tenantId: string): Promise<string | null> {
    try {
      const artifact = await this.prisma.client.artifact.findFirst({
        where: {
          url,
          tenantId,
        },
        select: {
          hash: true,
        },
      });
      return artifact?.hash || null;
    } catch (error: any) {
      this.logger.warn(`Failed to get stored hash for ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Hash für URL speichern
   */
  private async storeHash(url: string, hash: string, tenantId: string): Promise<void> {
    try {
      // Find existing artifact or create new one
      const existing = await this.prisma.client.artifact.findFirst({
        where: {
          url,
          tenantId,
        },
      });

      if (existing) {
        await this.prisma.client.artifact.update({
          where: { id: existing.id },
          data: {
            hash,
            updatedAt: new Date(),
          },
        });
      } else {
        await this.prisma.client.artifact.create({
          data: {
            tenantId,
            url,
            hash,
            name: url,
            storageType: 'url',
          },
        });
      }
    } catch (error: any) {
      // Ignore errors - hash storage is not critical
      this.logger.debug(`Failed to store hash for ${url}: ${error.message}`);
    }
  }

  /**
   * Reindex: Alle Seiten neu crawlen und indexieren
   */
  async reindex(tenantId: string, url?: string): Promise<CrawlResult> {
    this.logger.log(`Starting reindex for tenant ${tenantId}${url ? ` (${url})` : ''}`);
    
    const dto: StartCrawlDto = {
      url: url || 'https://example.com', // Fallback, sollte in Production nicht vorkommen
      tenantId,
      reindex: true, // Force reindex even if unchanged
      deltaCrawl: false, // Disable delta crawl for reindex
    };

    return this.startCrawl(dto);
  }
}





