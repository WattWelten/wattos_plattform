import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@wattweiser/db';
import { DocumentProcessorService } from '@wattweiser/document-processor';
import { VectorStoreService } from '../vector-store/vector-store.service';

export interface WebsiteIngestionRequest {
  url: string;
  knowledgeSpaceId: string;
  maxDepth?: number;
  maxPages?: number;
  chunkingOptions?: {
    strategy: 'fixed' | 'sentence' | 'paragraph' | 'semantic';
    chunkSize?: number;
    chunkOverlap?: number;
  };
  embeddingOptions?: {
    provider: 'openai' | 'azure' | 'anthropic';
    model?: string;
  };
}

export interface WebsiteIngestionResult {
  documentIds: string[];
  pagesProcessed: number;
  chunksCreated: number;
  processingTime: number;
}

@Injectable()
export class WebsiteIngestionService {
  private readonly logger = new Logger(WebsiteIngestionService.name);
  private readonly maxDepth: number;
  private readonly maxPages: number;
  private readonly documentProcessor: DocumentProcessorService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorStore: VectorStoreService,
    private readonly configService: ConfigService,
  ) {
    this.documentProcessor = new DocumentProcessorService();
    this.maxDepth = this.configService.get<number>('CRAWLER_MAX_DEPTH', 2);
    this.maxPages = this.configService.get<number>('CRAWLER_MAX_PAGES', 50);
  }

  /**
   * Crawlt eine Website und verarbeitet die Inhalte
   */
  async ingestWebsite(request: WebsiteIngestionRequest): Promise<WebsiteIngestionResult> {
    const startTime = Date.now();
    const { url, knowledgeSpaceId, maxDepth, maxPages, chunkingOptions, embeddingOptions } = request;

    // Validiere URL
    try {
      new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL');
    }

    // Crawle Website
    const pages = await this.crawlWebsite(url, maxDepth || this.maxDepth, maxPages || this.maxPages);

    const documentIds: string[] = [];
    let totalChunks = 0;

    // Verarbeite jede Seite
    for (const page of pages) {
      try {
        const result = await this.processPage(page, knowledgeSpaceId, chunkingOptions, embeddingOptions);
        documentIds.push(result.documentId);
        totalChunks += result.chunksCreated;
      } catch (error) {
        this.logger.warn(`Failed to process page ${page.url}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const processingTime = Date.now() - startTime;

    this.logger.log(
      `Website ingested successfully: ${url}, pages: ${pages.length}, chunks: ${totalChunks}, time: ${processingTime}ms`
    );

    return {
      documentIds,
      pagesProcessed: pages.length,
      chunksCreated: totalChunks,
      processingTime,
    };
  }

  /**
   * Crawlt eine Website (vereinfachte Implementierung)
   */
  private async crawlWebsite(baseUrl: string, maxDepth: number, maxPages: number): Promise<Array<{ url: string; content: string; title: string }>> {
    const visited = new Set<string>();
    const pages: Array<{ url: string; content: string; title: string }> = [];
    const queue: Array<{ url: string; depth: number }> = [{ url: baseUrl, depth: 0 }];

    while (queue.length > 0 && pages.length < maxPages) {
      const { url, depth } = queue.shift()!;

      if (visited.has(url) || depth > maxDepth) {
        continue;
      }

      visited.add(url);

      try {
        // Fetch Seite
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'WattOS-Crawler/1.0',
          },
        });

        if (!response.ok) {
          continue;
        }

        const html = await response.text();
        const { content, title, links } = this.parseHTML(html, url);

        // Speichere Seite
        pages.push({ url, content, title });

        // Füge Links zur Queue hinzu (nur wenn noch Platz)
        if (depth < maxDepth && pages.length < maxPages) {
          for (const link of links) {
            if (!visited.has(link)) {
              queue.push({ url: link, depth: depth + 1 });
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to crawl ${url}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return pages;
  }

  /**
   * Parst HTML und extrahiert Text, Titel und Links
   */
  private parseHTML(html: string, baseUrl: string): { content: string; title: string; links: string[] } {
    // Einfache HTML-Parsing (in Produktion: cheerio oder ähnlich verwenden)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

    // Entferne Scripts und Styles
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extrahiere Links
    const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
    const links: string[] = [];
    const baseUrlObj = new URL(baseUrl);

    for (const match of linkMatches) {
      const href = match[1];
      try {
        const absoluteUrl = new URL(href, baseUrlObj).href;
        // Nur HTTP/HTTPS Links
        if (absoluteUrl.startsWith('http://') || absoluteUrl.startsWith('https://')) {
          // Nur Links von derselben Domain
          const linkUrl = new URL(absoluteUrl);
          if (linkUrl.hostname === baseUrlObj.hostname) {
            links.push(absoluteUrl);
          }
        }
      } catch {
        // Ignoriere ungültige URLs
      }
    }

    return { content, title, links: [...new Set(links)] };
  }

  /**
   * Verarbeitet eine einzelne Seite
   */
  private async processPage(
    page: { url: string; content: string; title: string },
    knowledgeSpaceId: string,
    chunkingOptions?: WebsiteIngestionRequest['chunkingOptions'],
    embeddingOptions?: WebsiteIngestionRequest['embeddingOptions'],
  ): Promise<{ documentId: string; chunksCreated: number }> {
    // Erstelle Dokument in DB
    const document = await this.prisma.document.create({
      data: {
        knowledgeSpaceId,
        fileName: `${page.title}.html`,
        filePath: page.url,
        fileType: 'text/html',
        fileSize: BigInt(page.content.length),
        metadata: {
          title: page.title,
          url: page.url,
          crawledAt: new Date().toISOString(),
        },
      },
    });

    try {
      // Verarbeite Dokument
      const chunkingOpts = chunkingOptions || {
        strategy: 'sentence' as const,
        chunkSize: 1000,
        chunkOverlap: 200,
      };

      const embeddingOpts = embeddingOptions || {
        provider: 'openai' as const,
        model: 'text-embedding-3-small',
      };

      const result = await this.documentProcessor.processDocument(
        page.content,
        document.id,
        chunkingOpts,
        embeddingOpts,
        true, // PII-Redaction aktiviert
      );

      // Speichere Chunks
      const vectorStore = this.vectorStore.getVectorStore();
      if (!vectorStore) {
        throw new Error('Vector store not initialized');
      }

      let chunksCreated = 0;
      for (const chunk of result.chunks) {
        await this.prisma.chunk.create({
          data: {
            id: chunk.id,
            documentId: document.id,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            metadata: chunk.metadata || {},
            embedding: chunk.embedding,
          },
        });

        if (chunk.embedding) {
          await vectorStore.addVector({
            id: chunk.id,
            vector: chunk.embedding,
            metadata: {
              documentId: document.id,
              content: chunk.content,
              chunkIndex: chunk.chunkIndex,
              url: page.url,
              title: page.title,
              ...chunk.metadata,
            },
          });
        }

        chunksCreated++;
      }

      return { documentId: document.id, chunksCreated };
    } catch (error) {
      // Lösche Dokument bei Fehler
      await this.prisma.document.delete({
        where: { id: document.id },
      }).catch(() => {});

      throw error;
    }
  }
}
