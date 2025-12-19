/**
 * Search Request
 */
export interface SearchRequest {
  knowledgeSpaceId: string;
  query: string;
  topK?: number;
  minScore?: number;
  filters?: Record<string, any>;
}

/**
 * Search Result Item
 */
export interface SearchResultItem {
  chunkId: string;
  documentId?: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

/**
 * Search Result
 */
export interface SearchResult {
  query: string;
  knowledgeSpaceId: string;
  results: SearchResultItem[];
  totalResults: number;
}


