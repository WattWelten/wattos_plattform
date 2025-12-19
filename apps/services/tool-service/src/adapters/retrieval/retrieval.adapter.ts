import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { IToolAdapter } from '../interfaces/adapter.interface';
import { ToolExecutionRequest, ToolExecutionResult } from '../../registry/interfaces/tool.interface';
import { ServiceDiscoveryService } from '@wattweiser/shared';

/**
 * Retrieval Adapter (RAG)
 * Durchsucht Wissensräume mit RAG
 */
@Injectable()
export class RetrievalAdapter implements IToolAdapter {
  private readonly logger = new Logger(RetrievalAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      const { knowledgeSpaceId, query, topK = 5 } = request.input;

      // Input validieren
      if (!knowledgeSpaceId || !query) {
        throw new Error('Knowledge space ID and query are required');
      }

      // RAG-Service aufrufen (URL aus Config)
      const ragServiceUrl = this.serviceDiscovery.getServiceUrl('rag-service', 3007);

      const response = await firstValueFrom(
        this.httpService.post(`${ragServiceUrl}/search`, {
          knowledgeSpaceId,
          query,
          topK,
        }),
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: {
          results: response.data.results || [],
          query,
          knowledgeSpaceId,
        },
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      this.logger.error(`Retrieval search failed: ${error.message}`);

      return {
        success: false,
        error: error.message || 'Retrieval search failed',
        executionTime,
      };
    }
  }

  async validateInput(input: Record<string, any>): Promise<boolean> {
    if (!input.knowledgeSpaceId || !input.query) {
      return false;
    }

    if (typeof input.query !== 'string' || input.query.trim().length === 0) {
      return false;
    }

    if (input.topK && (typeof input.topK !== 'number' || input.topK < 1 || input.topK > 100)) {
      return false;
    }

    return true;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Health-Check: RAG-Service prüfen
      const ragServiceUrl = this.serviceDiscovery.getServiceUrl('rag-service', 3007);
      const response = await firstValueFrom(
        this.httpService.get(`${ragServiceUrl}/health`).pipe(
          // Timeout nach 5 Sekunden
          // timeout(5000)
        ),
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }
}


