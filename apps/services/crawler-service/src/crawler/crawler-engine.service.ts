import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as cheerio from 'cheerio';
import { firstValueFrom } from 'rxjs';
import { CrawledPage } from './interfaces/crawled-page.interface';

@Injectable()
export class CrawlerEngineService {
  private readonly logger = new Logger(CrawlerEngineService.name);
  private readonly userAgent: string;
  private readonly timeout: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.userAgent = this.configService.get<string>('crawler.userAgent', 'WattOS-KI-Crawler/1.0');
    this.timeout = this.configService.get<number>('crawler.timeout', 30000);
  }

  /**
   * Einzelne Seite crawlen
   */
  async crawlPage(url: string, depth: number = 0): Promise<CrawledPage | null> {
    try {
      this.logger.debug(`Crawling page: ${url} (depth: ${depth})`);

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'User-Agent': this.userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: this.timeout,
          maxRedirects: 5,
        }),
      );

      const html = response.data;
      const $ = cheerio.load(html);

      // Text-Content extrahieren
      const title = $('title').text().trim() || '';
      const description = $('meta[name="description"]').attr('content') || '';
      const keywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || [];
      const language = $('html').attr('lang') || $('meta[http-equiv="content-language"]').attr('content') || 'de';

      // Haupt-Content extrahieren (body ohne scripts, styles, etc.)
      $('script, style, nav, footer, header, aside').remove();
      const content = $('body').text().replace(/\s+/g, ' ').trim();

      // Links extrahieren
      const links: string[] = [];
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, url).href;
            links.push(absoluteUrl);
          } catch {
            // Relative URL oder ungültige URL - ignorieren
          }
        }
      });

      // Bilder extrahieren
      const images: string[] = [];
      $('img[src]').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
          try {
            const absoluteUrl = new URL(src, url).href;
            images.push(absoluteUrl);
          } catch {
            // Relative URL oder ungültige URL - ignorieren
          }
        }
      });

      // Metadaten extrahieren
      const metadata = {
        description,
        keywords,
        language,
        author: $('meta[name="author"]').attr('content'),
        publishedDate: $('meta[property="article:published_time"]').attr('content') ||
          $('time[datetime]').first().attr('datetime'),
        modifiedDate: $('meta[property="article:modified_time"]').attr('content'),
      };

      return {
        url,
        title,
        content,
        html,
        metadata,
        links,
        images,
        depth,
        crawledAt: new Date(),
      };
    } catch (error: any) {
      this.logger.warn(`Failed to crawl page ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * URL normalisieren
   */
  normalizeUrl(url: string, baseUrl: string): string | null {
    try {
      const urlObj = new URL(url, baseUrl);
      // Fragment entfernen
      urlObj.hash = '';
      // Query-Parameter behalten (können wichtig sein)
      return urlObj.href;
    } catch {
      return null;
    }
  }

  /**
   * Prüfen ob URL erlaubt ist
   */
  isUrlAllowed(
    url: string,
    allowedDomains: string[],
    excludePaths: string[] = [],
  ): boolean {
    try {
      const urlObj = new URL(url);

      // Domain-Prüfung
      if (allowedDomains.length > 0) {
        const isAllowed = allowedDomains.some(domain => {
          const domainPattern = domain.replace(/\./g, '\\.').replace(/\*/g, '.*');
          const regex = new RegExp(`^https?://.*${domainPattern}`, 'i');
          return regex.test(url);
        });
        if (!isAllowed) {
          return false;
        }
      }

      // Exclude-Paths-Prüfung
      if (excludePaths.length > 0) {
        const pathname = urlObj.pathname;
        if (excludePaths.some(exclude => pathname.includes(exclude))) {
          return false;
        }
      }

      // Nur HTTP/HTTPS erlauben
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}














