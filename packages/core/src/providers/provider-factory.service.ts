import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProfileService } from '../profiles/profile.service';
import { RAGService } from '../knowledge/rag/rag.service';
import { F13RAGProvider } from '@wattweiser/f13';
import { F13Client } from '@wattweiser/f13';
import { F13RAGProviderWrapper } from '../knowledge/rag/providers/f13.rag.provider';

/**
 * Provider Factory Service
 * 
 * Erstellt Provider basierend auf Tenant-Profile
 */
@Injectable()
export class ProviderFactoryService {
  private readonly logger = new Logger(ProviderFactoryService.name);

  constructor(
    private readonly profileService: ProfileService,
    private readonly ragService: RAGService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Provider für Tenant initialisieren
   */
  async initializeProvidersForTenant(tenantId: string): Promise<void> {
    const profile = await this.profileService.getProfile(tenantId);

    this.logger.debug(`Initializing providers for tenant: ${tenantId}`, {
      market: profile.market,
      mode: profile.mode,
      providers: profile.providers,
    });

    // RAG Provider registrieren
    if (profile.providers.rag === 'f13') {
      // F13 RAG Provider nur bei gov-f13 Mode laden
      if (profile.mode === 'gov-f13') {
        try {
          // F13 Client erstellen (benötigt ConfigService)
          const f13Client = new F13Client(this.configService);

          // F13 RAG Provider erstellen
          const f13RAGProvider = new F13RAGProvider(f13Client);
          const wrapper = new F13RAGProviderWrapper(f13RAGProvider);
          
          // Provider registrieren
          this.ragService.registerProvider('f13', wrapper);
          
          this.logger.log(`F13 RAG Provider registered for tenant: ${tenantId}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(`Failed to register F13 provider: ${errorMessage}`, errorStack);
          // Fallback zu WattWeiser Provider
          this.logger.warn(`Falling back to WattWeiser provider for tenant: ${tenantId}`);
        }
      } else {
        this.logger.warn(`F13 provider requested but mode is not gov-f13 for tenant: ${tenantId}`);
      }
    }

    // LLM, Parser, Summary Provider werden über Provider-Factory im LLM-Gateway verwaltet
    // Diese werden bei Bedarf über Service Discovery aufgerufen
  }

  /**
   * Provider für Tenant abrufen
   */
  async getProviderForTenant<T>(
    tenantId: string,
    providerType: 'llm' | 'rag' | 'parser' | 'summarize',
  ): Promise<T | null> {
    const profile = await this.profileService.getProfile(tenantId);
    const providerName = profile.providers[providerType];

    if (!providerName) {
      return null;
    }

    // RAG Provider zurückgeben
    if (providerType === 'rag') {
      const provider = this.ragService.getProvider(providerName);
      return (provider as unknown) as T;
    }

    // LLM, Parser, Summary Provider werden über LLM-Gateway verwaltet
    // Diese werden nicht direkt zurückgegeben, sondern über Service Discovery aufgerufen
    return null;
  }
}
