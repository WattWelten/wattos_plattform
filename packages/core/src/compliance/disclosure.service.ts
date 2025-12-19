import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../events/bus.service';
import { EventDomain, ComplianceEventSchema } from '../events/types';
import { ProfileService } from '../profiles/profile.service';
import { TenantProfile } from '../profiles/types';
import { v4 as uuid } from 'uuid';

/**
 * Disclosure Type
 */
export type DisclosureType = 'standard' | 'gov-full' | 'minimal';

/**
 * Disclosure Content
 */
export interface DisclosureContent {
  title: string;
  text: string;
  required: boolean;
  acknowledged?: boolean;
  acknowledgedAt?: number;
}

/**
 * Disclosure Service
 * 
 * Verwaltet Disclosure-Anzeige und -Tracking
 */
@Injectable()
export class DisclosureService {
  private readonly logger = new Logger(DisclosureService.name);
  private disclosures: Map<string, DisclosureContent> = new Map(); // sessionId -> disclosure

  constructor(
    private readonly eventBus: EventBusService,
    private readonly profileService: ProfileService,
  ) {}

  /**
   * Disclosure für Session abrufen/erstellen
   */
  async getDisclosure(tenantId: string, sessionId: string): Promise<DisclosureContent | null> {
    const profile = await this.profileService.getProfile(tenantId);

    // Prüfe ob Disclosure erforderlich ist
    if (profile.compliance.disclosure !== true) {
      return null;
    }

    // Prüfe ob bereits vorhanden
    if (this.disclosures.has(sessionId)) {
      return this.disclosures.get(sessionId)!;
    }

    // Disclosure-Type basierend auf Profile
    const disclosureType = this.getDisclosureType(profile.mode, profile.market);
    const disclosure = this.createDisclosure(disclosureType, profile);

    this.disclosures.set(sessionId, disclosure);

    // Event emittieren
    await this.emitDisclosureShown(tenantId, sessionId, disclosureType);

    return disclosure;
  }

  /**
   * Disclosure bestätigen
   */
  async acknowledgeDisclosure(
    tenantId: string,
    sessionId: string,
    userId?: string,
  ): Promise<boolean> {
    const disclosure = this.disclosures.get(sessionId);
    if (!disclosure) {
      this.logger.warn(`Disclosure not found for session: ${sessionId}`);
      return false;
    }

    disclosure.acknowledged = true;
    disclosure.acknowledgedAt = Date.now();
    this.disclosures.set(sessionId, disclosure);

    // Audit-Event emittieren
    const auditEvent = ComplianceEventSchema.parse({
      id: uuid(),
      type: `${EventDomain.COMPLIANCE}.audit.logged`,
      domain: EventDomain.COMPLIANCE,
      action: 'audit.logged',
      timestamp: Date.now(),
      sessionId,
      tenantId,
      userId,
      payload: {
        action: 'disclosure.acknowledged',
        details: {
          sessionId,
          acknowledgedAt: disclosure.acknowledgedAt,
        },
      },
    });

    await this.eventBus.emit(auditEvent);

    this.logger.log(`Disclosure acknowledged for session: ${sessionId}`);
    return true;
  }

  /**
   * Disclosure-Type bestimmen
   */
  private getDisclosureType(mode: string, market: string): DisclosureType {
    if (mode === 'gov-f13') {
      return 'gov-full';
    }
    if (market === 'gov') {
      return 'gov-full';
    }
    if (market === 'health' || market === 'finance') {
      return 'standard';
    }
    return 'minimal';
  }

  /**
   * Disclosure erstellen
   */
  private createDisclosure(type: DisclosureType, profile: TenantProfile): DisclosureContent {
    const disclosures: Record<DisclosureType, DisclosureContent> = {
      'gov-full': {
        title: 'KI-Assistent Hinweis (Vollständig)',
        text: `Dieser KI-Assistent nutzt künstliche Intelligenz zur Beantwortung Ihrer Fragen. 

WICHTIG:
- Die Antworten werden automatisch generiert und können Fehler enthalten
- Bitte prüfen Sie wichtige Informationen in den Originalquellen
- Alle Quellenangaben sind verpflichtend angezeigt
- Ihre Daten werden gemäß DSGVO und AI Act verarbeitet
- Vollständige Audit-Logs werden für Nachvollziehbarkeit gespeichert

Durch die Nutzung bestätigen Sie, dass Sie diese Hinweise verstanden haben.`,
        required: true,
      },
      standard: {
        title: 'KI-Assistent Hinweis',
        text: `Dieser KI-Assistent nutzt künstliche Intelligenz zur Beantwortung Ihrer Fragen. 

Hinweise:
- Die Antworten werden automatisch generiert
- Quellenangaben werden angezeigt, wenn verfügbar
- Ihre Daten werden gemäß DSGVO verarbeitet

Durch die Nutzung bestätigen Sie, dass Sie diese Hinweise verstanden haben.`,
        required: true,
      },
      minimal: {
        title: 'KI-Assistent',
        text: 'Dieser Assistent nutzt künstliche Intelligenz. Antworten können Fehler enthalten.',
        required: false,
      },
    };

    return disclosures[type];
  }

  /**
   * Disclosure-Shown Event emittieren
   */
  private async emitDisclosureShown(
    tenantId: string,
    sessionId: string,
    disclosureType: DisclosureType,
  ): Promise<void> {
    const event = ComplianceEventSchema.parse({
      id: uuid(),
      type: `${EventDomain.COMPLIANCE}.disclosure.shown`,
      domain: EventDomain.COMPLIANCE,
      action: 'disclosure.shown',
      timestamp: Date.now(),
      sessionId,
      tenantId,
      payload: {
        disclosureType,
        action: 'shown',
      },
    });

    await this.eventBus.emit(event);
  }

  /**
   * Disclosure-Status prüfen
   */
  isDisclosureRequired(tenantId: string): Promise<boolean> {
    return this.profileService.getProfile(tenantId).then(
      (profile) => profile.compliance.disclosure === true,
    );
  }
}

