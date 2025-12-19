import { Injectable } from '@nestjs/common';
import { IProfileValidator, TenantProfile, Market, Mode } from '../types';

/**
 * Gov Profile Validator
 * 
 * Validiert Gov-Profile-Konfiguration
 */
@Injectable()
export class GovValidator implements IProfileValidator {
  /**
   * Profile validieren
   */
  async validate(profile: TenantProfile): Promise<boolean> {
    // Gov-spezifische Validierung
    if (profile.market !== Market.GOV) {
      return false;
    }

    // Mode muss standard oder gov-f13 sein
    if (profile.mode !== Mode.STANDARD && profile.mode !== Mode.GOV_F13) {
      return false;
    }

    // Disclosure immer erforderlich für Gov
    if (!profile.compliance.disclosure) {
      return false;
    }

    // Quellenpflicht immer aktiv für Gov
    if (!profile.features.sourceRequired) {
      return false;
    }

    return true;
  }

  /**
   * Standard Gov-Profile
   */
  getDefaultProfile(tenantId: string): TenantProfile {
    return {
      id: tenantId,
      tenantId,
      market: Market.GOV,
      mode: Mode.GOV_F13, // Standard: F13 aktiviert
      providers: {
        llm: 'f13',
        rag: 'f13',
        parser: 'f13',
        summarize: 'f13',
        speech: 'wattweiser', // Speech bleibt bei WattWeiser
      },
      compliance: {
        gdpr: true,
        aiAct: true,
        disclosure: true, // Immer aktiv
        retentionDays: 365, // 1 Jahr
      },
      features: {
        guidedFlows: true, // Geführte Journeys
        sourceRequired: true, // Quellenpflicht
        hitlRequired: false,
        toolCallsEnabled: false, // Begrenzt
        visionEnabled: false,
        webChat: true,
        phone: true,
        whatsapp: false, // Meist nicht für Gov
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}

