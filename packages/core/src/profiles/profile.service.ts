import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@wattweiser/db';
import { TenantProfile, Market, Mode, ProviderConfig, ComplianceConfig, FeatureFlags } from './types';

/**
 * Profile Service
 * 
 * Verwaltet Tenant-Profile mit Caching
 */
@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private cache: Map<string, TenantProfile> = new Map();
  private cacheTTL: number = 3600000; // 1 Stunde
  private readonly prisma: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    this.cacheTTL = this.configService.get<number>('PROFILE_CACHE_TTL', 3600000);
    this.prisma = new PrismaClient();
  }

  /**
   * Profile laden
   */
  async getProfile(tenantId: string): Promise<TenantProfile> {
    // Prüfe Cache
    const cached = this.cache.get(tenantId);
    if (cached && this.isCacheValid(cached)) {
      this.logger.debug(`Profile loaded from cache: ${tenantId}`);
      return cached;
    }

    // Aus Datenbank laden (wenn Prisma verfügbar)
    if (this.prisma) {
      try {
        const dbProfile = await this.prisma.tenantProfile.findUnique({
          where: { tenantId },
        });

      if (dbProfile) {
        const profile: TenantProfile = {
          id: dbProfile.id,
          tenantId: dbProfile.tenantId,
          market: dbProfile.market as Market,
          mode: dbProfile.mode as Mode,
          providers: dbProfile.providers as ProviderConfig,
          compliance: dbProfile.compliance as ComplianceConfig,
          features: dbProfile.features as FeatureFlags,
          createdAt: dbProfile.createdAt.getTime(),
          updatedAt: dbProfile.updatedAt.getTime(),
        };

        // Cache speichern
        this.cache.set(tenantId, profile);
        this.logger.debug(`Profile loaded from DB: ${tenantId}`, {
          market: profile.market,
          mode: profile.mode,
        });

        return profile;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Failed to load profile from DB: ${errorMessage}`, {
          tenantId,
        });
        // Fallback zu Placeholder
      }
    }

    // Fallback: Standard-Enterprise-Profile (wenn nicht in DB)
    const profile: TenantProfile = {
      id: tenantId,
      tenantId,
      market: Market.ENTERPRISE,
      mode: Mode.STANDARD,
      providers: {
        llm: 'wattweiser',
        rag: 'wattweiser',
        parser: 'wattweiser',
        summarize: 'wattweiser',
        speech: 'wattweiser',
      },
      compliance: {
        gdpr: true,
        aiAct: true,
        disclosure: false,
        retentionDays: 90,
      },
      features: {
        guidedFlows: false,
        sourceRequired: false,
        hitlRequired: false,
        toolCallsEnabled: true,
        visionEnabled: false,
        webChat: true,
        phone: true,
        whatsapp: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Cache speichern
    this.cache.set(tenantId, profile);
    this.logger.debug(`Profile loaded: ${tenantId}`, { market: profile.market, mode: profile.mode });

    return profile;
  }

  /**
   * Profile aktualisieren
   */
  async updateProfile(tenantId: string, updates: Partial<TenantProfile>): Promise<TenantProfile> {
    const current = await this.getProfile(tenantId);
    const updated: TenantProfile = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    };

    // In Datenbank speichern (wenn Prisma verfügbar)
    if (this.prisma) {
      try {
        await this.prisma.tenantProfile.upsert({
        where: { tenantId },
        create: {
          tenantId,
          market: updated.market,
          mode: updated.mode,
          providers: updated.providers as any,
          compliance: updated.compliance as any,
          features: updated.features as any,
        },
        update: {
          market: updated.market,
          mode: updated.mode,
          providers: updated.providers as any,
          compliance: updated.compliance as any,
          features: updated.features as any,
        },
      });
        this.logger.debug(`Profile saved to DB: ${tenantId}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Failed to save profile to DB: ${errorMessage}`, {
          tenantId,
        });
        // Weiter mit Cache-Update auch bei DB-Fehler
      }
    }

    // Cache aktualisieren
    this.cache.set(tenantId, updated);
    this.logger.log(`Profile updated: ${tenantId}`);

    return updated;
  }

  /**
   * Cache validieren
   */
  private isCacheValid(profile: TenantProfile): boolean {
    const age = Date.now() - profile.updatedAt;
    return age < this.cacheTTL;
  }

  /**
   * Cache invalidieren
   */
  invalidateCache(tenantId: string): void {
    this.cache.delete(tenantId);
    this.logger.debug(`Cache invalidated: ${tenantId}`);
  }

  /**
   * Cache leeren
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Profile cache cleared');
  }
}

