import { IVectorStore, Vector, SearchResult, SearchOptions } from '../../interfaces/vector-store.interface';

/**
 * PgVector Store Implementation
 * Uses pgvector extension for vector similarity search in PostgreSQL
 */
export class PgVectorStore implements IVectorStore {
  private client: any; // PostgreSQL client (Prisma or pg)
  private tableName: string;
  private embeddingDimension: number;

  constructor(client: any, tableName: string = 'chunks', embeddingDimension: number = 1536) {
    this.client = client;
    this.tableName = tableName;
    this.embeddingDimension = embeddingDimension;
  }

  /**
   * Upsert vectors into the store
   * Uses INSERT ... ON CONFLICT for upsert behavior
   */
  async upsert(vectors: Vector[]): Promise<void> {
    if (vectors.length === 0) return;

    try {
      // Build query for batch upsert
      const values: any[] = [];
      const placeholders: string[] = [];

      vectors.forEach((vector, index) => {
        const baseIndex = index * 4;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}::vector, $${baseIndex + 4}::jsonb)`);
        values.push(
          vector.id,
          vector.content,
          `[${vector.embedding.join(',')}]`, // pgvector format
          JSON.stringify(vector.metadata),
        );
      });

      const query = `
        INSERT INTO ${this.tableName} (id, content, embedding, metadata)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) 
        DO UPDATE SET
          content = EXCLUDED.content,
          embedding = EXCLUDED.embedding,
          metadata = EXCLUDED.metadata
      `;

      // Execute query
      if (this.client.query) {
        // Direct pg client
        await this.client.query(query, values);
      } else if (this.client.$executeRawUnsafe) {
        // Prisma client
        await this.client.$executeRawUnsafe(query, ...values);
      } else {
        throw new Error('Unsupported database client type');
      }
    } catch (error: any) {
      throw new Error(`Failed to upsert vectors: ${error.message}`);
    }
  }

  /**
   * Search for similar vectors using cosine similarity
   */
  async search(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const { k = 10, filter = {}, includeMetadata = true } = options;

    if (queryEmbedding.length !== this.embeddingDimension) {
      throw new Error(
        `Query embedding dimension (${queryEmbedding.length}) does not match expected dimension (${this.embeddingDimension})`,
      );
    }

    try {
      // Build filter conditions
      const filterConditions: string[] = [];
      const queryParams: Array<string | number> = [`[${queryEmbedding.join(',')}]`, k];

      // Add metadata filters
      if (Object.keys(filter).length > 0) {
        Object.entries(filter).forEach(([key, value]) => {
          if (typeof value === 'string') {
            filterConditions.push(`metadata->>'${key}' = $${queryParams.length + 1}`);
            queryParams.push(value);
          } else if (typeof value === 'number') {
            filterConditions.push(`(metadata->>'${key}')::numeric = $${queryParams.length + 1}`);
            queryParams.push(value);
          } else if (Array.isArray(value)) {
            filterConditions.push(`metadata->>'${key}' = ANY($${queryParams.length + 1}::text[])`);
            queryParams.push(value);
          }
        });
      }

      const whereClause = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';

      // Build SELECT clause
      const selectFields = includeMetadata
        ? 'id, content, metadata, 1 - (embedding <=> $1::vector) as score'
        : 'id, content, \'{}\'::jsonb as metadata, 1 - (embedding <=> $1::vector) as score';

      const query = `
        SELECT ${selectFields}
        FROM ${this.tableName}
        ${whereClause}
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `;

      let results: Array<{
        id: string;
        content: string;
        metadata: Record<string, unknown>;
        score: number;
      }>;

      // Execute query
      if (this.client.query) {
        // Direct pg client
        const result = await this.client.query(query, queryParams);
        results = result.rows;
      } else if (this.client.$queryRawUnsafe) {
        // Prisma client
        results = await this.client.$queryRawUnsafe(query, ...queryParams);
      } else {
        throw new Error('Unsupported database client type');
      }

      // Transform results
      return results.map((row) => ({
        id: String(row.id),
        content: String(row.content),
        score: parseFloat(String(row.score)) || 0,
        metadata: includeMetadata
          ? typeof row.metadata === 'string'
            ? (JSON.parse(row.metadata) as Record<string, unknown>)
            : (row.metadata as Record<string, unknown>)
          : {},
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to search vectors: ${errorMessage}`);
    }
  }

  /**
   * Delete vectors by IDs
   */
  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    try {
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
      const query = `DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`;

      if (this.client.query) {
        // Direct pg client
        await this.client.query(query, ids);
      } else if (this.client.$executeRawUnsafe) {
        // Prisma client
        await this.client.$executeRawUnsafe(query, ...ids);
      } else {
        throw new Error('Unsupported database client type');
      }
    } catch (error: any) {
      throw new Error(`Failed to delete vectors: ${error.message}`);
    }
  }

  /**
   * Check if pgvector extension is installed and ready
   */
  async isReady(): Promise<boolean> {
    try {
      const query = "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') as exists";

      let result: any;

      if (this.client.query) {
        // Direct pg client
        const queryResult = await this.client.query(query);
        result = queryResult.rows[0];
      } else if (this.client.$queryRawUnsafe) {
        // Prisma client
        const queryResult = await this.client.$queryRawUnsafe(query);
        result = Array.isArray(queryResult) ? queryResult[0] : queryResult;
      } else {
        return false;
      }

      return result?.exists === true || result?.exists === 't';
    } catch {
      return false;
    }
  }
}

