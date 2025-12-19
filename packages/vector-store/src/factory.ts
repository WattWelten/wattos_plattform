import { IVectorStore } from './interfaces/vector-store.interface';
import { PgVectorStore } from './implementations/pgvector/pgvector.store';
import { OpenSearchStore } from './implementations/opensearch/opensearch.store';
import { VECTOR_STORE_TYPES } from '@wattweiser/shared';

export type VectorStoreType = typeof VECTOR_STORE_TYPES[keyof typeof VECTOR_STORE_TYPES];

export interface VectorStoreConfig {
  type: VectorStoreType;
  connection: any; // Database/OpenSearch client
  tableName?: string;
  indexName?: string;
}

export class VectorStoreFactory {
  static create(config: VectorStoreConfig): IVectorStore {
    switch (config.type) {
      case VECTOR_STORE_TYPES.PGVECTOR:
        if (!config.tableName) {
          throw new Error('tableName is required for pgvector');
        }
        return new PgVectorStore(config.connection, config.tableName);

      case VECTOR_STORE_TYPES.OPENSEARCH:
        if (!config.indexName) {
          throw new Error('indexName is required for OpenSearch');
        }
        return new OpenSearchStore(config.connection, config.indexName);

      default:
        throw new Error(`Unsupported vector store type: ${config.type}`);
    }
  }
}


