/**
 * Crawler Scheduler Service
 * 
 * Führt geplante Crawls aus (z.B. täglich um 05:00)
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@wattweiser/db';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ServiceDiscoveryService } from '@wattweiser/shared';

@Injectable()
export class CrawlerSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(CrawlerSchedulerService.name);
  private readonly enabled: boolean;
  private readonly crawlerServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {
    this.enabled = configService.get<boolean>('CRAWLER_SCHEDULER_ENABLED', true);
    this.crawlerServiceUrl = serviceDiscovery.getServiceUrl('crawler-service', 3015);
  }

  onModuleInit() {
    if (this.enabled) {
      this.logger.log('Crawler Scheduler initialized');
    } else {
      this.logger.warn('Crawler Scheduler is disabled');
    }
  }

  /**
   * Täglicher Crawl um 05:00
   * Cron: 0 5 * * * (jeden Tag um 05:00)
   */
  @Cron('0 5 * * *', {
    name: 'daily-crawl',
    timeZone: 'Europe/Berlin',
  })
  async handleDailyCrawl() {
    if (!this.enabled) {
      return;
    }

    this.logger.log('Starting scheduled daily crawl at 05:00');

    try {
      // Alle aktiven Sources abrufen
      const sources = await this.prisma.client.source.findMany({
        where: {
          enabled: true,
        },
        include: {
          tenant: true,
        },
      });

      this.logger.log(`Found ${sources.length} active sources to crawl`);

      // Für jede Source einen Delta-Crawl starten
      for (const source of sources) {
        try {
          await this.startDeltaCrawl(source.tenantId, source.url, source.id);
          this.logger.log(`Delta crawl started for source ${source.id} (${source.url})`);
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Failed to start crawl for source ${source.id}: ${errorMessage}`);
        }
      }

      this.logger.log(`Scheduled crawl completed: ${sources.length} sources processed`);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Scheduled crawl failed: ${errorMessage}`, errorStack);
    }
  }

  /**
   * Delta-Crawl für eine Source starten
   */
  private async startDeltaCrawl(tenantId: string, url: string, sourceId: string): Promise<void> {
    try {
      // Crawl-Eintrag in DB erstellen
      const crawl = await this.prisma.client.crawl.create({
        data: {
          tenantId,
          sourceId,
          status: 'running',
          metadata: {
            scheduled: true,
            crawlType: 'delta',
          },
        },
      });

      // Crawl über Crawler-Service starten
      const response = await firstValueFrom(
        this.httpService.post(`${this.crawlerServiceUrl}/api/v1/crawler/start`, {
          url,
          tenantId,
          deltaCrawl: true, // Delta-Crawl aktivieren
          reindex: false,
        }),
      );

      // Crawl-Status aktualisieren
      await this.prisma.client.crawl.update({
        where: { id: crawl.id },
        data: {
          status: 'running',
          metadata: {
            ...crawl.metadata,
            crawlId: response.data.id,
          },
        },
      });

      this.logger.debug(`Delta crawl started: ${crawl.id} for source ${sourceId}`);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to start delta crawl for ${url}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Manueller Trigger für Testing
   */
  async triggerScheduledCrawl(): Promise<void> {
    this.logger.log('Manually triggering scheduled crawl');
    await this.handleDailyCrawl();
  }
}

