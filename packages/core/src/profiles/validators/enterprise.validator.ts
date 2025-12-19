import { Injectable } from '@nestjs/common';
import { IProfileValidator, TenantProfile, Market, Mode } from '../types';

/**
 * Enterprise Profile Validator
 * 
 * Validiert Enterprise-Profile-Konfiguration
 */
@Injectable()
export class EnterpriseValidator implements IProfileValidator {
  /**
   * Profile validieren
   */
  async validate(profile: TenantProfile): Promise<boolean> {
    // Enterprise-spezifische Validierung
    if (profile.market !== Market.ENTERPRISE) {
      return false;
    }

    // Mode muss standard oder regulated sein
    if (profile.mode !== Mode.STANDARD && profile.mode !== Mode.REGULATED) {
      return false;
    }

    // F13 nicht erlaubt für Enterprise
    if (profile.providers.llm === 'f13' || profile.providers.rag === 'f13') {
      return false;
    }

    return true;
  }

  /**
   * Standard Enterprise-Profile
   */
  getDefaultProfile(tenantId: string): TenantProfile {
    return {
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
  }
}

