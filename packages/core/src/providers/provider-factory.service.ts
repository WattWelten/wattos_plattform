import { Injectable, Logger } from '@nestjs/common';
import { ProfileService } from '../profiles/profile.service';
import { RAGService } from '../knowledge/rag/rag.service';
import { F13RAGProvider } from '@wattweiser/f13';
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
          // TODO: F13 Module importieren und Provider erstellen
          // const f13Module = await import('@wattweiser/f13');
          // const f13RAGProvider = new f13Module.F13RAGProvider(...);
          // const wrapper = new F13RAGProviderWrapper(f13RAGProvider);
          // this.ragService.registerProvider('f13', wrapper);
          
          this.logger.log(`F13 RAG Provider registered for tenant: ${tenantId}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Failed to register F13 provider: ${errorMessage}`);
          // Fallback zu WattWeiser Provider
          this.logger.warn(`Falling back to WattWeiser provider for tenant: ${tenantId}`);
        }
      } else {
        this.logger.warn(`F13 provider requested but mode is not gov-f13 for tenant: ${tenantId}`);
      }
    }

    // TODO: LLM, Parser, Summary Provider ähnlich
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

    // TODO: Provider-Instanz zurückgeben
    return null;
  }
}

