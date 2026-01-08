import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@wattweiser/db';
import { DocumentProcessorService } from '@wattweiser/document-processor';
import { VectorStoreService } from '../vector-store/vector-store.service';

export interface FileIngestionRequest {
  file: Express.Multer.File;
  knowledgeSpaceId: string;
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

export interface FileIngestionResult {
  documentId: string;
  chunksCreated: number;
  processingTime: number;
}

@Injectable()
export class FileIngestionService {
  private readonly logger = new Logger(FileIngestionService.name);
  private readonly documentProcessor: DocumentProcessorService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorStore: VectorStoreService,
    private readonly configService: ConfigService,
  ) {
    this.documentProcessor = new DocumentProcessorService();
  }

  /**
   * Verarbeitet eine hochgeladene Datei
   */
  async ingestFile(request: FileIngestionRequest): Promise<FileIngestionResult> {
    const startTime = Date.now();
    const { file, knowledgeSpaceId, chunkingOptions, embeddingOptions } = request;

    // Validiere Datei
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided');
    }

    // Extrahiere Text aus Datei (basierend auf MIME-Type)
    const content = await this.extractTextFromFile(file);

    // Erstelle Dokument in DB
    const document = await this.prisma.document.create({
      data: {
        knowledgeSpaceId,
        fileName: file.originalname,
        filePath: file.path || `uploaded/${file.originalname}`,
        fileType: file.mimetype,
        fileSize: BigInt(file.size),
        metadata: {
          uploadedAt: new Date().toISOString(),
          mimeType: file.mimetype,
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
        content,
        document.id,
        chunkingOpts,
        embeddingOpts,
        true, // PII-Redaction aktiviert
      );

      // Speichere Chunks in DB und Vector Store
      const chunksCreated = await this.storeChunks(document.id, result.chunks);

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `File ingested successfully: ${document.id}, chunks: ${chunksCreated}, time: ${processingTime}ms`
      );

      return {
        documentId: document.id,
        chunksCreated,
        processingTime,
      };
    } catch (error) {
      // Lösche Dokument bei Fehler
      await this.prisma.document.delete({
        where: { id: document.id },
      }).catch(() => {
        // Ignoriere Fehler beim Löschen
      });

      this.logger.error(`File ingestion failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Extrahiert Text aus Datei basierend auf MIME-Type
   */
  private async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    const mimeType = file.mimetype;

    // Text-Dateien
    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      return file.buffer.toString('utf-8');
    }

    // PDF (vereinfacht - in Produktion: pdf-parse oder ähnlich)
    if (mimeType === 'application/pdf') {
      // TODO: PDF-Parsing implementieren
      throw new BadRequestException('PDF parsing not yet implemented');
    }

    // Markdown
    if (mimeType === 'text/markdown' || file.originalname.endsWith('.md')) {
      return file.buffer.toString('utf-8');
    }

    // HTML
    if (mimeType === 'text/html') {
      // TODO: HTML zu Text konvertieren (Tags entfernen)
      const htmlContent = file.buffer.toString('utf-8');
      return htmlContent.replace(/<[^>]*>/g, ''); // Einfache Tag-Entfernung
    }

    // Office-Dokumente (vereinfacht)
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      throw new BadRequestException('Word document parsing not yet implemented');
    }

    // Fallback: Versuche als Text zu lesen
    try {
      return file.buffer.toString('utf-8');
    } catch {
      throw new BadRequestException(`Unsupported file type: ${mimeType}`);
    }
  }

  /**
   * Speichert Chunks in DB und Vector Store
   */
  private async storeChunks(documentId: string, chunks: any[]): Promise<number> {
    const vectorStore = this.vectorStore.getVectorStore();
    if (!vectorStore) {
      throw new Error('Vector store not initialized');
    }

    let storedCount = 0;

    for (const chunk of chunks) {
      // Speichere in DB
      await this.prisma.chunk.create({
        data: {
          id: chunk.id,
          documentId,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          metadata: chunk.metadata || {},
          embedding: chunk.embedding,
        },
      });

      // Speichere in Vector Store
      if (chunk.embedding) {
        await vectorStore.addVector({
          id: chunk.id,
          vector: chunk.embedding,
          metadata: {
            documentId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            ...chunk.metadata,
          },
        });
      }

      storedCount++;
    }

    return storedCount;
  }
}
