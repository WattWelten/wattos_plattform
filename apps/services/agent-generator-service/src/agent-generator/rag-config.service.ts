import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';

/**
 * RAG Config Service
 * 
 * Erstellt RAG-Konfiguration für einen Agent basierend auf Persona
 */
@Injectable()
export class RAGConfigService {
  private readonly logger = new Logger(RAGConfigService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * RAG-Konfiguration erstellen
   */
  async createRAGConfig(
    persona: {
      characterId: string | null;
    },
    tenantId: string,
  ): Promise<Record<string, unknown>> {
    try {
      // Knowledge Space für Character finden
      const knowledgeSpace = await this.prisma.knowledgeSpace.findFirst({
        where: {
          tenantId,
          settings: {
            path: ['characterId'],
            equals: persona.characterId,
          },
        },
      });

      return {
        enabled: true,
        knowledgeSpaceId: knowledgeSpace?.id || null,
        topK: 5,
        similarityThreshold: 0.7,
        rerank: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to create RAG config: ${errorMessage}`);
      return {
        enabled: true,
        knowledgeSpaceId: null,
        topK: 5,
        similarityThreshold: 0.7,
        rerank: false,
      };
    }
  }
}

