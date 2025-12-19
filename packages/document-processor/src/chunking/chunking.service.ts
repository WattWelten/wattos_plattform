import { DocumentChunk, ChunkingOptions } from '../interfaces/document-processor.interface';
import { ChunkingStrategies } from './chunking-strategies';

/**
 * Chunking Service
 * Orchestriert verschiedene Chunking-Strategien
 */
export class ChunkingService {
  /**
   * Dokument in Chunks aufteilen
   */
  chunkDocument(
    content: string,
    documentId: string,
    options: ChunkingOptions,
  ): DocumentChunk[] {
    switch (options.strategy) {
      case 'fixed':
        return ChunkingStrategies.fixedSize(content, documentId, options);

      case 'sentence':
        return ChunkingStrategies.sentenceBased(content, documentId, options);

      case 'paragraph':
        return ChunkingStrategies.paragraphBased(content, documentId, options);

      case 'semantic':
        // TODO: Semantic chunking (benötigt Embeddings)
        // Für jetzt: Fallback zu sentence-based
        return ChunkingStrategies.sentenceBased(content, documentId, options);

      default:
        throw new Error(`Unknown chunking strategy: ${options.strategy}`);
    }
  }
}


