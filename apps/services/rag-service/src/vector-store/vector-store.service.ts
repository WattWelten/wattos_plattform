import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@wattweiser/db';
import { IVectorStore, VectorStoreFactory, VectorStoreConfig } from '@wattweiser/vector-store';
import { VECTOR_STORE_TYPES } from '@wattweiser/shared';

/**
 * Vector Store Service
 * Wrapper für VectorStore-Integration
 */
@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);
  private vectorStore: IVectorStore | null = null;
  private prisma: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    this.prisma = new PrismaClient();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const vectorStoreType = this.configService.get<string>('VECTOR_STORE_TYPE', 'pgvector');
      
      let connection: any;
      if (vectorStoreType === VECTOR_STORE_TYPES.PGVECTOR) {
        // Prisma Client als Connection für pgvector
        connection = this.prisma;
      } else if (vectorStoreType === VECTOR_STORE_TYPES.OPENSEARCH) {
        // OpenSearch Client (wenn implementiert)
        const opensearchUrl = this.configService.get<string>('OPENSEARCH_URL', 'http://localhost:9200');
        // TODO: OpenSearch Client erstellen
        throw new Error('OpenSearch not yet fully implemented');
      } else {
        throw new Error(`Unsupported vector store type: ${vectorStoreType}`);
      }

      const vectorStoreConfig: VectorStoreConfig = {
        type: vectorStoreType as any,
        connection,
        tableName: 'chunks',
        indexName: 'chunks',
      };

      this.vectorStore = VectorStoreFactory.create(vectorStoreConfig);
      this.logger.log(`Vector store service initialized: ${vectorStoreType}`);
    } catch (error: any) {
      this.logger.error(`Failed to initialize vector store service: ${error.message}`);
    }
  }

  getVectorStore(): IVectorStore | null {
    return this.vectorStore;
  }
}


