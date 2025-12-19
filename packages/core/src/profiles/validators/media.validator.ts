import { Injectable } from '@nestjs/common';
import { IProfileValidator, TenantProfile, Market, Mode } from '../types';

/**
 * Media Profile Validator
 * 
 * Validiert Media-Profile-Konfiguration
 */
@Injectable()
export class MediaValidator implements IProfileValidator {
  /**
   * Profile validieren
   */
  async validate(profile: TenantProfile): Promise<boolean> {
    // Media-spezifische Validierung
    if (profile.market !== Market.MEDIA) {
      return false;
    }

    // Mode muss standard sein
    if (profile.mode !== Mode.STANDARD) {
      return false;
    }

    // Human-in-the-Loop immer erforderlich für Media
    if (!profile.features.hitlRequired) {
      return false;
    }

    // Tool-Calls nicht erlaubt für Media
    if (profile.features.toolCallsEnabled) {
      return false;
    }

    return true;
  }

  /**
   * Standard Media-Profile
   */
  getDefaultProfile(tenantId: string): TenantProfile {
    return {
      id: tenantId,
      tenantId,
      market: Market.MEDIA,
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
        disclosure: true, // Transparenz wichtig
        retentionDays: 180, // 6 Monate
      },
      features: {
        guidedFlows: false,
        sourceRequired: false,
        hitlRequired: true, // Verpflichtend
        toolCallsEnabled: false, // Nicht erlaubt
        visionEnabled: false,
        webChat: true,
        phone: false,
        whatsapp: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}

