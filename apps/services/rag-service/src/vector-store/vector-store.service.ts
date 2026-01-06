import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@wattweiser/db';
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

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const vectorStoreType = this.configService.get<string>('VECTOR_STORE_TYPE', 'pgvector');
      
      let connection: any;
      if (vectorStoreType === VECTOR_STORE_TYPES.PGVECTOR) {
        // Prisma Client als Connection für pgvector
        connection = this.prismaService.client;
      } else if (vectorStoreType === VECTOR_STORE_TYPES.OPENSEARCH) {
        // OpenSearch Client erstellen
        const opensearchUrl = this.configService.get<string>('OPENSEARCH_URL', 'http://localhost:9200');
        const opensearchUsername = this.configService.get<string>('OPENSEARCH_USERNAME');
        const opensearchPassword = this.configService.get<string>('OPENSEARCH_PASSWORD');
        
        // OpenSearch Client (verwendet @opensearch-project/opensearch wenn verfügbar)
        // Für jetzt: Basic HTTP Client
        connection = {
          url: opensearchUrl,
          username: opensearchUsername,
          password: opensearchPassword,
        };
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


