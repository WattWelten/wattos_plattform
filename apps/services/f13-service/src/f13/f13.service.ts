import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@wattweiser/db';
import { F13Client, F13LLMProvider, F13RAGProvider } from '@wattweiser/f13';
import { KBSyncService } from './kb-sync.service';
import { F13RAGService } from './f13-rag.service';
import { F13ChatService } from './f13-chat.service';

/**
 * F13 Service (Haupt-Service)
 * 
 * Orchestriert F13-Funktionalität: KB-Sync, RAG-Suche, Chat-Integration
 */
@Injectable()
export class F13Service {
  private readonly logger = new Logger(F13Service.name);
  private readonly prisma: PrismaClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly f13Client: F13Client,
    private readonly f13LLMProvider: F13LLMProvider,
    private readonly f13RAGProvider: F13RAGProvider,
    private readonly kbSyncService: KBSyncService,
    private readonly f13RAGService: F13RAGService,
    private readonly f13ChatService: F13ChatService,
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * F13-Konfiguration für Tenant abrufen/erstellen
   */
  async getF13Config(tenantId: string): Promise<{
    id: string;
    tenantId: string;
    baseUrl: string;
    kbSyncEnabled: boolean;
    kbSyncInterval: string | null;
    autoApprove: boolean;
  }> {
    try {
      let config = await this.prisma.f13Config.findUnique({
        where: { tenantId },
      });

      if (!config) {
        // Standard-Konfiguration erstellen
        config = await this.prisma.f13Config.create({
          data: {
            tenantId,
            baseUrl: this.configService.get<string>('F13_BASE_URL') || '',
            kbSyncEnabled: false,
            kbSyncInterval: '0 2 * * *', // Täglich um 2:00 Uhr
            autoApprove: false,
          },
        });
      }

      return {
        id: config.id,
        tenantId: config.tenantId,
        baseUrl: config.baseUrl,
        kbSyncEnabled: config.kbSyncEnabled,
        kbSyncInterval: config.kbSyncInterval || null,
        autoApprove: config.autoApprove,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get F13 config: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * F13-Konfiguration aktualisieren
   */
  async updateF13Config(
    tenantId: string,
    updates: {
      baseUrl?: string;
      apiKey?: string;
      kbSyncEnabled?: boolean;
      kbSyncInterval?: string;
      autoApprove?: boolean;
    },
  ): Promise<void> {
    try {
      await this.prisma.f13Config.upsert({
        where: { tenantId },
        update: {
          ...(updates.baseUrl && { baseUrl: updates.baseUrl }),
          ...(updates.apiKey && { apiKey: updates.apiKey }), // MVP: Unverschlüsselt, später verschlüsseln
          ...(updates.kbSyncEnabled !== undefined && { kbSyncEnabled: updates.kbSyncEnabled }),
          ...(updates.kbSyncInterval && { kbSyncInterval: updates.kbSyncInterval }),
          ...(updates.autoApprove !== undefined && { autoApprove: updates.autoApprove }),
          updatedAt: new Date(),
        },
        create: {
          tenantId,
          baseUrl: updates.baseUrl || this.configService.get<string>('F13_BASE_URL') || '',
          apiKey: updates.apiKey,
          kbSyncEnabled: updates.kbSyncEnabled ?? false,
          kbSyncInterval: updates.kbSyncInterval || '0 2 * * *',
          autoApprove: updates.autoApprove ?? false,
        },
      });

      this.logger.log(`F13 config updated for tenant: ${tenantId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to update F13 config: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Health Check
   */
  async healthCheck(tenantId?: string): Promise<{
    healthy: boolean;
    f13Api: boolean;
    kbSync: boolean;
    services: Record<string, boolean>;
  }> {
    const services: Record<string, boolean> = {};

    try {
      // F13 API Health Check
      const f13ApiHealthy = await this.f13Client.healthCheck();
      services.f13Api = f13ApiHealthy;

      // LLM Provider Health Check
      const llmHealthy = await this.f13LLMProvider.healthCheck();
      services.llm = llmHealthy;

      // RAG Provider Health Check
      const ragHealthy = await this.f13RAGProvider.healthCheck();
      services.rag = ragHealthy;

      // KB-Sync Health Check (wenn Tenant angegeben)
      let kbSyncHealthy = true;
      if (tenantId) {
        kbSyncHealthy = await this.kbSyncService.healthCheck(tenantId);
      }
      services.kbSync = kbSyncHealthy;

      const allHealthy = Object.values(services).every((v) => v === true);

      return {
        healthy: allHealthy,
        f13Api: f13ApiHealthy,
        kbSync: kbSyncHealthy,
        services,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Health check failed: ${errorMessage}`);
      return {
        healthy: false,
        f13Api: false,
        kbSync: false,
        services,
      };
    }
  }
}


