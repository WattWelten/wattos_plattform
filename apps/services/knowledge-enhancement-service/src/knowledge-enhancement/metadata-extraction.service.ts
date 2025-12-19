import { Injectable, Logger } from '@nestjs/common';

/**
 * Metadata Extraction Service
 * 
 * Extrahiert Metadaten aus gecrawlten Daten
 */
@Injectable()
export class MetadataExtractionService {
  private readonly logger = new Logger(MetadataExtractionService.name);

  /**
   * Metadaten extrahieren
   */
  async extractMetadata(validatedData: any[]): Promise<any> {
    this.logger.debug(`Extracting metadata from ${validatedData.length} pages`);

    const metadata = {
      totalPages: validatedData.length,
      sources: new Set<string>(),
      languages: new Set<string>(),
      categories: new Set<string>(),
      totalWords: 0,
      totalLinks: 0,
      totalImages: 0,
      dateRange: {
        earliest: null as Date | null,
        latest: null as Date | null,
      },
    };

    for (const page of validatedData) {
      // Source
      if (page.source) {
        metadata.sources.add(page.source);
      }

      // Language
      if (page.metadata?.language) {
        metadata.languages.add(page.metadata.language);
      }

      // Word Count
      if (page.metadata?.wordCount) {
        metadata.totalWords += page.metadata.wordCount;
      }

      // Links
      if (page.links) {
        metadata.totalLinks += page.links.length;
      }

      // Images
      if (page.images) {
        metadata.totalImages += page.images.length;
      }

      // Date Range
      if (page.crawledAt) {
        const crawledDate = new Date(page.crawledAt);
        if (!metadata.dateRange.earliest || crawledDate < metadata.dateRange.earliest) {
          metadata.dateRange.earliest = crawledDate;
        }
        if (!metadata.dateRange.latest || crawledDate > metadata.dateRange.latest) {
          metadata.dateRange.latest = crawledDate;
        }
      }
    }

    return {
      ...metadata,
      sources: Array.from(metadata.sources),
      languages: Array.from(metadata.languages),
      categories: Array.from(metadata.categories),
      averageWordsPerPage: metadata.totalPages > 0 ? metadata.totalWords / metadata.totalPages : 0,
      averageLinksPerPage: metadata.totalPages > 0 ? metadata.totalLinks / metadata.totalPages : 0,
      averageImagesPerPage: metadata.totalPages > 0 ? metadata.totalImages / metadata.totalPages : 0,
    };
  }
}

