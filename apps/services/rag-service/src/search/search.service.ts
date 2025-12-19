import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@wattweiser/db';
import { IVectorStore, VectorStoreFactory, VectorStoreConfig } from '@wattweiser/vector-store';
import { CacheService } from '@wattweiser/shared';
import { SearchResult, SearchRequest } from './interfaces/search.interface';

/**
 * Search Service
 * Führt Vector-Search in Wissensräumen durch
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private prisma: PrismaClient;
  private vectorStore: IVectorStore | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService?: CacheService,
  ) {
    this.prisma = new PrismaClient();
    this.initializeVectorStore();
  }

  /**
   * Vector Store initialisieren
   */
  private async initializeVectorStore(): Promise<void> {
    try {
      const vectorStoreType = this.configService.get('vectorStore.type');
      const config = this.configService.get(`vectorStore.${vectorStoreType}`);

      const vectorStoreConfig: VectorStoreConfig = {
        type: vectorStoreType as any,
        connection: config,
        tableName: 'chunks', // Für pgvector
        indexName: 'chunks', // Für OpenSearch
      };

      this.vectorStore = VectorStoreFactory.create(vectorStoreConfig);
      this.logger.log(`Vector store initialized: ${vectorStoreType}`);
    } catch (error) {
      this.logger.error(`Failed to initialize vector store: ${error}`);
    }
  }

  /**
   * Suche in Wissensraum
   */
  async search(request: SearchRequest): Promise<SearchResult> {
    // Cache-Key generieren
    const cacheKey = `rag-search:${request.knowledgeSpaceId}:${request.query}:${request.topK || 'default'}:${request.minScore || 'default'}`;
    
    // Prüfe Cache
    if (this.cacheService) {
      const cachedResult = await this.cacheService.get<SearchResult>(cacheKey);
      if (cachedResult) {
        this.logger.debug(`Returning cached RAG search result for query: ${request.query}`);
        if (this.cacheService) {
          await this.cacheService.set(`cache:${cacheKey}`, 'hit', 60); // Track cache hit
        }
        return cachedResult;
      }
    }

    try {
      // Wissensraum validieren
      const knowledgeSpace = await this.prisma.knowledgeSpace.findUnique({
        where: { id: request.knowledgeSpaceId },
      });

      if (!knowledgeSpace) {
        throw new NotFoundException(`Knowledge space ${request.knowledgeSpaceId} not found`);
      }

      // Query-Embedding generieren
      const queryEmbedding = await this.generateEmbedding(request.query);

      // Vector-Search durchführen
      if (!this.vectorStore) {
        throw new Error('Vector store not initialized');
      }

      const results = await this.vectorStore.search(queryEmbedding, {
        k: request.topK || this.configService.get('search.defaultTopK'),
        filter: {
          knowledgeSpaceId: request.knowledgeSpaceId,
        },
      });

      // Chunks aus DB abrufen (optimiert: select statt include für bessere Performance)
      const chunkIds = results.map((r) => r.id);
      const chunks = await this.prisma.chunk.findMany({
        where: {
          id: { in: chunkIds },
        },
        select: {
          id: true,
          content: true,
          metadata: true,
          documentId: true,
          document: {
            select: {
              fileName: true,
              fileType: true,
            },
          },
        },
      });

      // Ergebnisse mit Chunk-Daten anreichern
      const enrichedResults = results.map((result) => {
        const chunk = chunks.find((c) => c.id === result.id);
        return {
          chunkId: result.id,
          documentId: chunk?.documentId,
          score: result.score,
          content: chunk?.content || '',
          metadata: {
            ...chunk?.metadata,
            fileName: chunk?.document?.fileName,
            fileType: chunk?.document?.fileType,
          },
        };
      });

      // Nach Score filtern
      const minScore = request.minScore || this.configService.get('search.minScore');
      const filteredResults = enrichedResults.filter((r) => r.score >= minScore);

      const result: SearchResult = {
        query: request.query,
        knowledgeSpaceId: request.knowledgeSpaceId,
        results: filteredResults,
        totalResults: filteredResults.length,
      };

      // Cache speichern
      if (this.cacheService) {
        const cacheTtl = this.configService.get<number>('RAG_CACHE_TTL', 300); // 5 Minuten default
        await this.cacheService.set(cacheKey, result, cacheTtl);
        this.logger.debug(`Cached RAG search result for query: ${request.query}`);
      }

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Search failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Embedding generieren
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const provider = this.configService.get('embeddings.provider');
    const model = this.configService.get('embeddings.model');
    const apiKey = this.configService.get('embeddings.apiKey');

    if (provider === 'openai') {
      // OpenAI Embeddings API
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI embedding failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } else if (provider === 'ollama') {
      // Ollama Embeddings (lokal)
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
      const response = await fetch(`${ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama embedding failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } else {
      throw new Error(`Unsupported embedding provider: ${provider}`);
    }
  }
}

