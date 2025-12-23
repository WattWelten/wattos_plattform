import { Injectable, Logger } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { FeatureFlags } from './types';

/**
 * Feature Not Enabled Error
 */
export class FeatureNotEnabledError extends Error {
  constructor(public readonly feature: string, public readonly tenantId: string) {
    super(`Feature '${feature}' is not enabled for tenant '${tenantId}'`);
    this.name = 'FeatureNotEnabledError';
  }
}

/**
 * Feature Flags Service
 * 
 * Verwaltet Feature-Flags basierend auf Tenant-Profile
 */
@Injectable()
export class FeatureFlagsService {
  // private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(private readonly profileService: ProfileService) {}

  /**
   * Feature prüfen
   */
  async isEnabled(tenantId: string, feature: keyof FeatureFlags): Promise<boolean> {
    const profile = await this.profileService.getProfile(tenantId);
    return profile.features[feature] ?? false;
  }

  /**
   * Feature erforderlich (wirft Error wenn nicht aktiviert)
   */
  async requireFeature(tenantId: string, feature: keyof FeatureFlags): Promise<void> {
    const enabled = await this.isEnabled(tenantId, feature);
    if (!enabled) {
      throw new FeatureNotEnabledError(feature, tenantId);
    }
  }

  /**
   * Mehrere Features prüfen
   */
  async areEnabled(tenantId: string, features: Array<keyof FeatureFlags>): Promise<Record<string, boolean>> {
    const profile = await this.profileService.getProfile(tenantId);
    const result: Record<string, boolean> = {};

    for (const feature of features) {
      result[feature] = profile.features[feature] ?? false;
    }

    return result;
  }

  /**
   * Alle Features abrufen
   */
  async getAllFeatures(tenantId: string): Promise<FeatureFlags> {
    const profile = await this.profileService.getProfile(tenantId);
    return profile.features;
  }

  /**
   * Channel-Feature prüfen
   */
  async isChannelEnabled(tenantId: string, channel: 'webChat' | 'phone' | 'whatsapp' | 'telegram' | 'sms'): Promise<boolean> {
    return await this.isEnabled(tenantId, channel);
  }
}

