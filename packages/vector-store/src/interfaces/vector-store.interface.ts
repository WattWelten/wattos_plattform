export interface Vector {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

export interface SearchOptions {
  k?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
}

export interface IVectorStore {
  /**
   * Upsert vectors into the store
   */
  upsert(vectors: Vector[]): Promise<void>;

  /**
   * Search for similar vectors
   */
  search(
    queryEmbedding: number[],
    options?: SearchOptions
  ): Promise<SearchResult[]>;

  /**
   * Delete vectors by IDs
   */
  delete(ids: string[]): Promise<void>;

  /**
   * Check if the store is ready
   */
  isReady(): Promise<boolean>;
}


