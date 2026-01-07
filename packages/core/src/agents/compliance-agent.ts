import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../events/bus.service';
import { Agent } from '../orchestrator/runtime.service';
import { Event, EventDomain, ComplianceEvent, ComplianceEventSchema } from '../events/types';
import { ProfileService } from '../profiles/profile.service';
import { PIIRedactionService } from '../compliance/pii-redaction.service';
import { v4 as uuid } from 'uuid';

/**
 * Compliance Agent
 * 
 * Verarbeitet Compliance-Events, prÃ¼ft Policies, fÃ¼hrt PII-Redaction durch
 */
@Injectable()
export class ComplianceAgent implements Agent {
  readonly name = 'compliance-agent';
  readonly version = '1.0.0';
  private readonly logger = new Logger(ComplianceAgent.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly profileService: ProfileService,
    private readonly piiRedactionService: PIIRedactionService,
  ) {}

  /**
   * Event verarbeiten
   */
  async handle(event: Event): Promise<Event | null> {
    // Nur Compliance-Events verarbeiten
    if (event.domain !== EventDomain.COMPLIANCE) {
      return null;
    }

    try {
      const complianceEvent = ComplianceEventSchema.parse(event);
      this.logger.debug(`Processing compliance event: ${complianceEvent.action}`, {
        sessionId: complianceEvent.sessionId,
        tenantId: complianceEvent.tenantId,
      });

      switch (complianceEvent.action) {
        case 'disclosure.shown':
          return await this.handleDisclosureShown(complianceEvent);
        case 'pii.detected':
          return await this.handlePIIDetected(complianceEvent);
        case 'pii.redacted':
          return await this.handlePIIRedacted(complianceEvent);
        case 'audit.logged':
          return await this.handleAuditLogged(complianceEvent);
        default:
          this.logger.warn(`Unknown compliance action: ${complianceEvent.action}`);
          return null;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing compliance event: ${errorMessage}`, errorStack);
      return null;
    }
  }

  /**
   * Disclosure anzeigen
   */
  private async handleDisclosureShown(event: ComplianceEvent): Promise<Event | null> {
    const { sessionId, tenantId } = event;
    const profile = await this.profileService.getProfile(tenantId);

    // PrÃ¼fe ob Disclosure erforderlich ist
    if (profile.compliance.disclosure !== true) {
      this.logger.debug(`Disclosure not required for tenant: ${tenantId}`);
      return null;
    }

    // Disclosure-Type basierend auf Profile
    const disclosureType = profile.mode === 'gov-f13' ? 'gov-full' : 'standard';

    this.logger.debug(`Disclosure shown: ${disclosureType}`);

    // Audit-Event emittieren
    const auditEvent: ComplianceEvent = {
      id: uuid(),
      type: `${EventDomain.COMPLIANCE}.audit.logged`,
      domain: EventDomain.COMPLIANCE,
      action: 'audit.logged',
      timestamp: Date.now(),
      sessionId,
      tenantId,
      userId: event.userId,
      payload: {
        action: 'disclosure.shown',
        disclosureType,
        details: {
          mode: profile.mode,
          market: profile.market,
        },
      },
      metadata: {
        agent: this.name,
        version: this.version,
      },
    };

    await this.eventBus.emit(auditEvent);

    return auditEvent;
  }

  /**
   * PII erkannt
   */
  private async handlePIIDetected(event: ComplianceEvent): Promise<Event | null> {
    const { sessionId, tenantId } = event;
    const profile = await this.profileService.getProfile(tenantId);

    // PrÃ¼fe ob PII-Redaction aktiviert ist
    if (profile.compliance.piiRedaction !== true) {
      this.logger.debug(`PII redaction not enabled for tenant: ${tenantId}`);
      return null;
    }

    const content = (event.payload.details?.content as string) || '';
    this.logger.debug(`PII detection requested for content length: ${content.length}`);

    // PII erkennen und redigieren
    const redactionResult = this.piiRedactionService.redactPII(content);

    // Redaction-Event emittieren
    const redactionEvent: ComplianceEvent = {
      id: uuid(),
      type: `${EventDomain.COMPLIANCE}.pii.redacted`,
      domain: EventDomain.COMPLIANCE,
      action: 'pii.redacted',
      timestamp: Date.now(),
      sessionId,
      tenantId,
      userId: event.userId,
      payload: {
        piiType: event.payload.piiType || 'multiple',
        action: 'redacted',
        details: {
          originalLength: content.length,
          redactedLength: redactionResult.redactedContent.length,
          redactionCount: redactionResult.redactionCount,
          detectedTypes: redactionResult.detections.map((d) => d.type),
        },
      },
      metadata: {
        agent: this.name,
        version: this.version,
        redactedContent: redactionResult.redactedContent, // FÃ¼r weitere Verarbeitung
      },
    };

    await this.eventBus.emit(redactionEvent);

    return redactionEvent;
  }

  /**
   * PII redigiert
   */
  private async handlePIIRedacted(event: ComplianceEvent): Promise<Event | null> {
    // PII wurde bereits redigiert, Event weiterleiten
    return event;
  }

  /**
   * Audit geloggt
   */
  private async handleAuditLogged(event: ComplianceEvent): Promise<Event | null> {
    // Audit wurde bereits geloggt, Event weiterleiten
    return event;
  }


  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Compliance-Agent ist immer verfÃ¼gbar
      return true;
    } catch {
      return false;
    }
  }
}

