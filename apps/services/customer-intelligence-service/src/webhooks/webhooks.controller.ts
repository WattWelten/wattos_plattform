import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ContentEnrichmentService } from '../content-enrichment/content-enrichment.service';
import { PrismaService } from '@wattweiser/db';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly contentEnrichmentService: ContentEnrichmentService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Webhook für Crawler-Daten
   */
  @Post('crawler/data')
  async handleCrawlerData(@Body() data: any) {
    this.logger.log(`Received crawler data webhook for URL: ${data.url}`);
    
    try {
      const { tenantId, url, title, content, language, metadata, crawledAt } = data;

      if (!tenantId || !url || !content) {
        return { received: false, error: 'Missing required fields: tenantId, url, content' };
      }

      // Content für alle Target Groups der aktiven Analysen anreichern
      const activeAnalyses = await this.prisma.customerAnalysis.findMany({
        where: {
          tenantId,
          status: { in: ['running', 'completed'] },
        },
        include: {
          targetGroups: true,
        },
      });

      if (activeAnalyses && activeAnalyses.length > 0) {
        for (const analysis of activeAnalyses) {
          for (const targetGroup of analysis.targetGroups) {
            // Content für Target Group anreichern
            await this.contentEnrichmentService.enrichContent({
              targetGroupId: targetGroup.id,
              sourceType: 'crawler',
              sourceId: url,
              content: `${title}\n\n${content}`,
              language: language || 'de',
            });
          }
        }
        this.logger.log(`Enriched content for ${activeAnalyses.length} analyses`);
      }

      return { received: true, processed: true, analysesUpdated: activeAnalyses?.length || 0 };
    } catch (error: any) {
      this.logger.error(`Failed to process crawler data: ${error.message}`);
      return { received: true, processed: false, error: error.message };
    }
  }

  /**
   * Webhook für verarbeitete Dokumente
   */
  @Post('ingestion/document-processed')
  async handleDocumentProcessed(@Body() data: any) {
    this.logger.log(`Received document processed webhook for document: ${data.document_id}`);
    
    try {
      // Handle both snake_case (from Python) and camelCase formats
      const tenantId = data.tenantId || data.tenant_id;
      const { document_id, filename, knowledge_space_id, chunks_count, processed_at } = data;

      if (!tenantId || !document_id) {
        return { received: false, error: 'Missing required fields: tenantId (or tenant_id), document_id' };
      }

      // Dokument aus DB laden (falls vorhanden)
      const document = await this.prisma.document.findUnique({
        where: { id: document_id },
        include: {
          knowledgeSpace: {
            include: {
              tenant: true,
            },
          },
        },
      });

      if (!document) {
        this.logger.warn(`Document ${document_id} not found in database`);
        return { received: true, processed: false, message: 'Document not found in database' };
      }

      // Content für alle Target Groups der aktiven Analysen anreichern
      const activeAnalyses = await this.prisma.customerAnalysis.findMany({
        where: {
          tenantId: tenantId || document.knowledgeSpace.tenantId,
          status: { in: ['running', 'completed'] },
        },
        include: {
          targetGroups: true,
        },
      });

      if (activeAnalyses && activeAnalyses.length > 0) {
        // Dokument-Content aus Chunks extrahieren (vereinfacht)
        const chunks = await this.prisma.chunk.findMany({
          where: { documentId: document_id },
          select: { content: true },
          take: 10, // Erste 10 Chunks für Content-Anreicherung
        });

        const documentContent = chunks.map((c) => c.content).join('\n\n');

        for (const analysis of activeAnalyses) {
          for (const targetGroup of analysis.targetGroups) {
            // Content für Target Group anreichern
            await this.contentEnrichmentService.enrichContent({
              targetGroupId: targetGroup.id,
              sourceType: 'document',
              sourceId: document_id,
              content: `${filename}\n\n${documentContent}`,
              language: 'de', // Default, könnte aus Dokument-Metadaten extrahiert werden
            });
          }
        }
        this.logger.log(`Enriched content from document ${document_id} for ${activeAnalyses.length} analyses`);
      }

      return { 
        received: true, 
        processed: true, 
        analysesUpdated: activeAnalyses?.length || 0,
        documentId: document_id,
      };
    } catch (error: any) {
      this.logger.error(`Failed to process document webhook: ${error.message}`);
      return { received: true, processed: false, error: error.message };
    }
  }
}

