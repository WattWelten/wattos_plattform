import { Injectable, Logger } from '@nestjs/common';
import { ProfileService } from '../profiles/profile.service';
import { RAGService } from '../knowledge/rag/rag.service';

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
    // Note: F13 RAG Provider wird über einen separaten Service registriert,
    // um zirkuläre Abhängigkeiten zu vermeiden
    if (profile.providers.rag === 'f13' && profile.mode !== 'gov-f13') {
      this.logger.warn(`F13 provider requested but mode is not gov-f13 for tenant: ${tenantId}`);
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
