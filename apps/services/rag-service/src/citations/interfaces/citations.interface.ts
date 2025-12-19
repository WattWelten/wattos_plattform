/**
 * Citation Request
 */
export interface CitationRequest {
  chunkIds: string[];
  scores?: Record<string, number>;
}

/**
 * Citation
 */
export interface Citation {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}


