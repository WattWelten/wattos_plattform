import {
  DocumentProcessorResult,
  ChunkingOptions,
  EmbeddingOptions,
} from './interfaces/document-processor.interface';
import { ChunkingService } from './chunking/chunking.service';
import { EmbeddingsService } from './embeddings/embeddings.service';
import { PiiDetector } from './pii/pii-detector';

/**
 * Document Processor Service
 * Orchestriert Chunking, Embeddings und PII-Redaction
 */
export class DocumentProcessorService {
  private chunkingService: ChunkingService;
  private embeddingsService: EmbeddingsService;
  private piiDetector: PiiDetector;

  constructor() {
    this.chunkingService = new ChunkingService();
    this.embeddingsService = new EmbeddingsService();
    this.piiDetector = new PiiDetector();
  }

  /**
   * Dokument verarbeiten
   */
  async processDocument(
    content: string,
    documentId: string,
    chunkingOptions: ChunkingOptions,
    embeddingOptions: EmbeddingOptions,
    redactPii: boolean = true,
  ): Promise<DocumentProcessorResult> {
    // 1. PII erkennen und redactieren (falls aktiviert)
    let processedContent = content;
    let piiDetected = false;
    let piiRedacted = false;

    if (redactPii) {
      const piiResult = this.piiDetector.detectAndRedact(content);
      piiDetected = piiResult.detected;
      piiRedacted = piiResult.detected;
      processedContent = piiResult.redactedContent;
    }

    // 2. Dokument in Chunks aufteilen
    const chunks = this.chunkingService.chunkDocument(
      processedContent,
      documentId,
      chunkingOptions,
    );

    // 3. Embeddings generieren
    const chunkTexts = chunks.map((chunk) => chunk.content);
    const embeddings = await this.embeddingsService.generateBatchEmbeddings(
      chunkTexts,
      embeddingOptions,
    );

    // 4. Embeddings zu Chunks hinzufügen
    chunks.forEach((chunk, index) => {
      if (embeddings[index]) {
        chunk.embedding = embeddings[index];
      }
    });

    return {
      chunks,
      embeddings,
      piiDetected,
      piiRedacted,
      metadata: {
        chunkCount: chunks.length,
        chunkingStrategy: chunkingOptions.strategy,
        embeddingProvider: embeddingOptions.provider,
        embeddingModel: embeddingOptions.model,
      },
    };
  }
}


