import { Injectable } from '@nestjs/common';
import { IProfileValidator, TenantProfile, Market, Mode } from '../types';

/**
 * Health/Finance Profile Validator
 * 
 * Validiert Regulated-Profile-Konfiguration (Health, Finance)
 */
@Injectable()
export class HealthValidator implements IProfileValidator {
  /**
   * Profile validieren
   */
  async validate(profile: TenantProfile): Promise<boolean> {
    // Health-spezifische Validierung
    if (profile.market !== Market.HEALTH) {
      return false;
    }

    // Mode muss regulated sein
    if (profile.mode !== Mode.REGULATED) {
      return false;
    }

    // Disclosure immer erforderlich
    if (!profile.compliance.disclosure) {
      return false;
    }

    // Human-in-the-Loop immer erforderlich
    if (!profile.features.hitlRequired) {
      return false;
    }

    // Tool-Calls nicht erlaubt
    if (profile.features.toolCallsEnabled) {
      return false;
    }

    // Längere Retention
    if (profile.compliance.retentionDays < 365) {
      return false;
    }

    return true;
  }

  /**
   * Standard Health-Profile
   */
  getDefaultProfile(tenantId: string): TenantProfile {
    return {
      id: tenantId,
      tenantId,
      market: Market.HEALTH,
      mode: Mode.REGULATED,
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
        disclosure: true,
        retentionDays: 730, // 2 Jahre
      },
      features: {
        guidedFlows: true,
        sourceRequired: true,
        hitlRequired: true, // Verpflichtend
        toolCallsEnabled: false, // Nicht erlaubt
        visionEnabled: false,
        webChat: true,
        phone: true,
        whatsapp: false,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}

