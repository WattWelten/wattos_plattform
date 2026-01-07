/**
 * RAG Provider Interface
 */
export interface RAGProvider {
  search(query: string, context: RAGContext): Promise<RAGResponse>;
  healthCheck(): Promise<boolean>;
}

/**
 * RAG Context
 */
export interface RAGContext {
  knowledgeSpaceId?: string;
  tenantId: string;
  filters?: Record<string, any>;
  topK?: number;
}

/**
 * RAG Response
 */
export interface RAGResponse {
  results: RAGResult[];
  query: string;
  metadata?: Record<string, any>;
}

/**
 * RAG Result
 */
export interface RAGResult {
  content: string;
  score: number;
  source: string;
  metadata?: Record<string, any>;
}



















