import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { PublicSourceCrawlerService } from './public-source-crawler.service';
import { DataValidatorService } from './data-validator.service';
import { DataEnrichmentService } from './data-enrichment.service';
import { MetadataExtractionService } from './metadata-extraction.service';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Knowledge Enhancement Service
 * 
 * Orchestriert automatisches Crawling, Validierung, Anreicherung und Metadaten-Extraktion
 */
@Injectable()
export class KnowledgeEnhancementService {
  private readonly logger = new Logger(KnowledgeEnhancementService.name);
  private readonly prisma: PrismaClient;

  // Öffentliche Quellen für automatisches Crawling
  private readonly publicSources = [
    {
      name: 'bund.de',
      baseUrl: 'https://www.bund.de',
      paths: ['/DE/Home/home_node.html', '/DE/Service/Newsletter/newsletter_node.html'],
      priority: 'high',
    },
    {
      name: 'niedersachsen.de',
      baseUrl: 'https://www.niedersachsen.de',
      paths: ['/startseite/', '/aktuelles/'],
      priority: 'high',
    },
  ];

  constructor(
    private readonly publicSourceCrawler: PublicSourceCrawlerService,
    private readonly dataValidator: DataValidatorService,
    private readonly dataEnrichment: DataEnrichmentService,
    private readonly metadataExtraction: MetadataExtractionService,
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Cron-Job: Täglich um 6:00 Uhr öffentliche Quellen crawlen
   */
  @Cron('0 6 * * *', {
    name: 'daily-public-source-crawl',
    timeZone: 'Europe/Berlin',
  })
  async handleDailyPublicSourceCrawl() {
    this.logger.log('Starting daily public source crawl at 6:00 AM');

    try {
      for (const source of this.publicSources) {
        await this.crawlAndEnhanceSource(source, undefined);
      }

      this.logger.log('Daily public source crawl completed');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Daily public source crawl failed: ${errorMessage}`);
    }
  }

  /**
   * Quelle crawlen und anreichern
   */
  async crawlAndEnhanceSource(
    source: { name: string; baseUrl: string; paths: string[]; priority: string },
    tenantId?: string,
  ): Promise<any> {
    this.logger.log(`Crawling and enhancing source: ${source.name}`);

    try {
      // 1. Crawling
      const crawledData = await this.publicSourceCrawler.crawlSource(source);

      // 2. Validierung
      const validatedData = await this.dataValidator.validateData(crawledData);

      // 3. Metadaten-Extraktion
      const metadata = await this.metadataExtraction.extractMetadata(validatedData);

      // 4. Daten-Anreicherung
      const enrichedData = await this.dataEnrichment.enrichData(validatedData, metadata);

      // 5. In Knowledge Space speichern (wenn tenantId vorhanden)
      if (tenantId) {
        await this.saveToKnowledgeSpace(tenantId, enrichedData, metadata);
      }

      this.logger.log(`Source crawled and enhanced: ${source.name}`, {
        pages: crawledData.length,
        validated: validatedData.length,
        enriched: enrichedData.length,
      });

      return {
        source: source.name,
        pages: crawledData.length,
        validated: validatedData.length,
        enriched: enrichedData.length,
        metadata,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to crawl and enhance source ${source.name}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Alle öffentlichen Quellen crawlen
   */
  async crawlAllPublicSources(tenantId?: string): Promise<any[]> {
    const results = [];

    for (const source of this.publicSources) {
      try {
        const result = await this.crawlAndEnhanceSource(source, tenantId);
        results.push(result);
      } catch (error) {
        this.logger.warn(`Failed to crawl source ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.push({
          source: source.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * In Knowledge Space speichern
   */
  private async saveToKnowledgeSpace(
    tenantId: string,
    enrichedData: any[],
    metadata: any,
  ): Promise<void> {
    // MVP: Placeholder für Integration mit Ingestion-Service
    // In Production: Dokumente an Ingestion-Service senden
    this.logger.debug(`Saving ${enrichedData.length} documents to knowledge space for tenant: ${tenantId}`);
  }
}

