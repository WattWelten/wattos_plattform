import { IVectorStore, Vector, SearchResult, SearchOptions } from '../../interfaces/vector-store.interface';

/**
 * OpenSearch Store Implementation
 * Uses OpenSearch KNN search for vector similarity
 */
export class OpenSearchStore implements IVectorStore {
  private client: any; // OpenSearch client
  private indexName: string;
  private vectorField: string;

  constructor(client: any, indexName: string, vectorField: string = 'embedding') {
    this.client = client;
    this.indexName = indexName;
    this.vectorField = vectorField;
  }

  /**
   * Upsert vectors using OpenSearch bulk API
   */
  async upsert(vectors: Vector[]): Promise<void> {
    if (vectors.length === 0) return;

    try {
      const body: any[] = [];

      // Build bulk request
      vectors.forEach((vector) => {
        // Index action
        body.push({
          index: {
            _index: this.indexName,
            _id: vector.id,
          },
        });

        // Document
        body.push({
          [this.vectorField]: vector.embedding,
          content: vector.content,
          metadata: vector.metadata,
        });
      });

      const response = await this.client.bulk({ body });

      // Check for errors
      if (response.errors) {
        const errors = response.items
          .filter((item: any) => item.index?.error)
          .map((item: any) => item.index.error);
        throw new Error(`OpenSearch bulk index errors: ${JSON.stringify(errors)}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to upsert vectors: ${error.message}`);
    }
  }

  /**
   * Search for similar vectors using KNN search
   */
  async search(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const { k = 10, filter = {} } = options;

    try {
      // Build KNN query
      const knnQuery: any = {
        query: {
          knn: {
            [this.vectorField]: {
              vector: queryEmbedding,
              k: k,
            },
          },
        },
      };

      // Add filter conditions
      if (Object.keys(filter).length > 0) {
        const mustClauses: any[] = [];

        Object.entries(filter).forEach(([key, value]) => {
          if (typeof value === 'string') {
            mustClauses.push({
              term: {
                [`metadata.${key}.keyword`]: value,
              },
            });
          } else if (typeof value === 'number') {
            mustClauses.push({
              term: {
                [`metadata.${key}`]: value,
              },
            });
          } else if (Array.isArray(value)) {
            mustClauses.push({
              terms: {
                [`metadata.${key}.keyword`]: value,
              },
            });
          }
        });

        if (mustClauses.length > 0) {
          knnQuery.query.bool = {
            must: [
              {
                knn: {
                  [this.vectorField]: {
                    vector: queryEmbedding,
                    k: k,
                  },
                },
              },
              ...mustClauses,
            ],
          };
        }
      }

      const response = await this.client.search({
        index: this.indexName,
        body: knnQuery,
      });

      // Transform results
      return response.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        content: hit._source.content,
        score: hit._score || 0,
        metadata: hit._source.metadata || {},
      }));
    } catch (error: any) {
      throw new Error(`Failed to search vectors: ${error.message}`);
    }
  }

  /**
   * Delete vectors by IDs
   */
  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    try {
      const body: any[] = [];

      ids.forEach((id) => {
        body.push({
          delete: {
            _index: this.indexName,
            _id: id,
          },
        });
      });

      const response = await this.client.bulk({ body });

      // Check for errors
      if (response.errors) {
        const errors = response.items
          .filter((item: any) => item.delete?.error)
          .map((item: any) => item.delete.error);
        throw new Error(`OpenSearch delete errors: ${JSON.stringify(errors)}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to delete vectors: ${error.message}`);
    }
  }

  /**
   * Check if index exists and is ready
   */
  async isReady(): Promise<boolean> {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      return exists.body || exists;
    } catch {
      return false;
    }
  }
}

