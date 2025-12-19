import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@wattweiser/db';
import { CrawlJobService } from './crawl-job.service';
import { IncrementalCrawlService } from './incremental-crawl.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ServiceDiscoveryService } from '@wattweiser/shared';

/**
 * Crawler Scheduler Service
 * 
 * Verwaltet Cron-basierte Crawling-Jobs mit Multi-URL-Support und Parallelisierung
 */
@Injectable()
export class CrawlerSchedulerService {
  private readonly logger = new Logger(CrawlerSchedulerService.name);
  private readonly prisma: PrismaClient;
  private readonly maxConcurrentCrawls: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly crawlJobService: CrawlJobService,
    private readonly incrementalCrawlService: IncrementalCrawlService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {
    this.prisma = new PrismaClient();
    this.maxConcurrentCrawls = this.configService.get<number>('CRAWLER_MAX_CONCURRENT', 5);
  }

  /**
   * Cron-Job: Täglich um 5:00 Uhr alle aktiven Crawl-Jobs ausführen
   */
  @Cron('0 5 * * *', {
    name: 'daily-crawl',
    timeZone: 'Europe/Berlin',
  })
  async handleDailyCrawl() {
    this.logger.log('Starting daily crawl job at 5:00 AM');
    
    try {
      const activeJobs = await this.crawlJobService.getActiveJobs();
      this.logger.log(`Found ${activeJobs.length} active crawl jobs`);

      // Parallelisierung: Max. maxConcurrentCrawls gleichzeitig
      const chunks = this.chunkArray(activeJobs, this.maxConcurrentCrawls);
      
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map((job) => this.executeCrawlJob(job.id)),
        );
      }

      this.logger.log('Daily crawl job completed');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Daily crawl job failed: ${errorMessage}`);
    }
  }

  /**
   * Cron-Job: Alle 15 Minuten prüfen ob Jobs ausgeführt werden müssen
   */
  @Cron('*/15 * * * *', {
    name: 'check-scheduled-jobs',
  })
  async handleScheduledJobs() {
    try {
      const dueJobs = await this.crawlJobService.getDueJobs();
      
      if (dueJobs.length > 0) {
        this.logger.log(`Found ${dueJobs.length} due crawl jobs`);
        
        // Parallelisierung
        const chunks = this.chunkArray(dueJobs, this.maxConcurrentCrawls);
        
        for (const chunk of chunks) {
          await Promise.all(
            chunk.map((job) => this.executeCrawlJob(job.id)),
          );
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Scheduled jobs check failed: ${errorMessage}`);
    }
  }

  /**
   * Crawl-Job ausführen
   */
  async executeCrawlJob(jobId: string): Promise<void> {
    try {
      const job = await this.crawlJobService.getJob(jobId);
      
      if (!job) {
        this.logger.warn(`Crawl job not found: ${jobId}`);
        return;
      }

      if (job.status !== 'active') {
        this.logger.debug(`Crawl job is not active: ${jobId}`);
        return;
      }

      this.logger.log(`Executing crawl job: ${jobId}`, {
        tenantId: job.tenantId,
        urlsCount: job.urls.length,
      });

      // Job-Status aktualisieren
      await this.crawlJobService.updateJobStatus(jobId, 'running');

      // Incremental Crawling prüfen
      const isIncremental = (job.config as any)?.incremental === true;
      
      if (isIncremental) {
        // Incremental Crawling: Nur geänderte Seiten crawlen
        await this.incrementalCrawlService.crawlIncremental(job);
      } else {
        // Vollständiges Crawling: Alle URLs crawlen
        await this.crawlUrls(job.urls, job.tenantId, job.characterId || undefined);
      }

      // Job-Status aktualisieren
      await this.crawlJobService.updateJobStatus(jobId, 'active', {
        lastRunAt: new Date(),
        nextRunAt: this.calculateNextRun(job.schedule),
      });

      this.logger.log(`Crawl job completed: ${jobId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Crawl job failed: ${errorMessage}`, errorStack, {
        jobId,
      });

      // Job-Status auf 'error' setzen
      await this.crawlJobService.updateJobStatus(jobId, 'error');
    }
  }

  /**
   * URLs crawlen (parallelisiert)
   */
  private async crawlUrls(
    urls: string[],
    tenantId: string,
    characterId?: string,
  ): Promise<void> {
    const crawlerServiceUrl = this.serviceDiscovery.getServiceUrl('crawler-service', 3015);

    // Parallelisierung: Max. 3 URLs gleichzeitig
    const chunks = this.chunkArray(urls, 3);

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map((url) =>
          this.crawlSingleUrl(url, tenantId, characterId, crawlerServiceUrl),
        ),
      );
    }
  }

  /**
   * Einzelne URL crawlen
   */
  private async crawlSingleUrl(
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

  /**
   * Nächsten Ausführungszeitpunkt berechnen
   */
  private calculateNextRun(schedule: string): Date {
    // Einfache Implementierung: Wenn Cron-Expression, nächste Ausführung berechnen
    // Für MVP: Standardmäßig nächster Tag um 5:00 Uhr
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(5, 0, 0, 0);
    return nextRun;
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

