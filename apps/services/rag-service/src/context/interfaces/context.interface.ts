import { SearchResultItem } from '../../search/interfaces/search.interface';

/**
 * Context Request
 */
export interface ContextRequest {
  searchResults: SearchResultItem[];
  maxTokens?: number;
  includeMetadata?: boolean;
}

/**
 * Citation
 */
export interface Citation {
  documentId: string;
  chunkId: string;
  content: string;
}

/**
 * Context Result
 */
export interface ContextResult {
  context: string;
  citations: Citation[];
  tokenCount: number;
  chunksUsed: number;
}


