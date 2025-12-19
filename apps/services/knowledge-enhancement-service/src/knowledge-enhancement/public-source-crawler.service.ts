import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';

/**
 * Public Source Crawler Service
 * 
 * Crawlt öffentliche Quellen (bund.de, niedersachsen.de)
 */
@Injectable()
export class PublicSourceCrawlerService {
  private readonly logger = new Logger(PublicSourceCrawlerService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Quelle crawlen
   */
  async crawlSource(source: {
    name: string;
    baseUrl: string;
    paths: string[];
    priority: string;
  }): Promise<any[]> {
    this.logger.log(`Crawling source: ${source.name}`, { baseUrl: source.baseUrl });

    const crawledPages: any[] = [];

    for (const path of source.paths) {
      try {
        const url = `${source.baseUrl}${path}`;
        const page = await this.crawlPage(url, source.name);
        if (page) {
          crawledPages.push(page);
        }
      } catch (error) {
        this.logger.warn(`Failed to crawl path ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return crawledPages;
  }

  /**
   * Einzelne Seite crawlen
   */
  private async crawlPage(url: string, sourceName: string): Promise<any | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'WattOS-Knowledge-Enhancement/1.0',
          },
        }),
      );

      const $ = cheerio.load(response.data);
      
      // Hauptinhalt extrahieren
      const title = $('title').text() || $('h1').first().text();
      const content = this.extractContent($);
      const links = this.extractLinks($, url);
      const images = this.extractImages($, url);

      return {
        url,
        source: sourceName,
        title: title.trim(),
        content: content.trim(),
        links,
        images,
        crawledAt: new Date(),
        metadata: {
          language: this.detectLanguage(content),
          wordCount: content.split(/\s+/).length,
          hasImages: images.length > 0,
          linkCount: links.length,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to crawl page ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Hauptinhalt extrahieren
   */
  private extractContent($: cheerio.CheerioAPI): string {
    // Entferne Scripts, Styles, Navigation, Footer
    $('script, style, nav, footer, header, aside').remove();

    // Extrahiere Text aus Hauptinhalt
    const mainContent = $('main, article, .content, #content, .main-content').first();
    
    if (mainContent.length > 0) {
      return mainContent.text();
    }

    // Fallback: Body-Text
    return $('body').text();
  }

  /**
   * Links extrahieren
   */
  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const links: string[] = [];
    const base = new URL(baseUrl);

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, base).href;
          links.push(absoluteUrl);
        } catch {
          // Ungültige URL ignorieren
        }
      }
    });

    return [...new Set(links)]; // Duplikate entfernen
  }

  /**
   * Bilder extrahieren
   */
  private extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const images: string[] = [];
    const base = new URL(baseUrl);

    $('img[src]').each((_, element) => {
      const src = $(element).attr('src');
      if (src) {
        try {
          const absoluteUrl = new URL(src, base).href;
          images.push(absoluteUrl);
        } catch {
          // Ungültige URL ignorieren
        }
      }
    });

    return [...new Set(images)]; // Duplikate entfernen
  }

  /**
   * Sprache erkennen (vereinfacht)
   */
  private detectLanguage(text: string): string {
    // MVP: Vereinfachte Erkennung
    // In Production: Language Detection Library verwenden
    if (text.match(/[äöüÄÖÜß]/)) {
      return 'de';
    }
    if (text.match(/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/)) {
      return 'fr';
    }
    if (text.match(/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/)) {
      return 'es';
    }
    return 'en';
  }
}


