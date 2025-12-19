/**
 * Document Processing Interfaces
 */

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface ChunkingOptions {
  strategy: 'fixed' | 'sentence' | 'paragraph' | 'semantic';
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

export interface EmbeddingOptions {
  provider: 'openai' | 'ollama' | 'local';
  model: string;
  dimensions?: number;
}

export interface PiiDetectionResult {
  detected: boolean;
  types: string[];
  redactedContent: string;
  entities: PiiEntity[];
}

export interface PiiEntity {
  type: string;
  value: string;
  start: number;
  end: number;
}

export interface DocumentProcessorResult {
  chunks: DocumentChunk[];
  embeddings: number[][];
  piiDetected: boolean;
  piiRedacted: boolean;
  metadata: Record<string, any>;
}


