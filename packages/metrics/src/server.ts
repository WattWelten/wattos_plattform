/**
 * Metrics Server Endpoint Handler
 * Für NestJS Integration
 */

import type { EventPayload } from './types';
import { eventSchema } from './types';

export interface MetricsService {
  persistEvent(payload: EventPayload): Promise<void>;
}

export class MetricsServer {
  constructor(private service: MetricsService) {}

  /**
   * Event von Client empfangen und persistieren
   */
  async handleLogEvent(payload: unknown): Promise<void> {
    // Validierung
    const validated = eventSchema.parse(payload);

    // Tenant-ID aus Request extrahieren (z.B. aus Headers oder Auth)
    // Hier vereinfacht - sollte aus Request Context kommen
    const tenantId = (payload as EventPayload).tenant_id;

    if (!tenantId) {
      throw new Error('tenant_id is required');
    }

    const eventPayload: EventPayload = {
      tenant_id: tenantId,
      event: validated,
    };

    const payloadTyped = payload as EventPayload;
    if (payloadTyped.conversation_id !== undefined) {
      eventPayload.conversation_id = payloadTyped.conversation_id;
    }

    if (payloadTyped.session_id !== undefined) {
      eventPayload.session_id = payloadTyped.session_id;
    }

    if (payloadTyped.metadata !== undefined) {
      eventPayload.metadata = payloadTyped.metadata;
    }

    await this.service.persistEvent(eventPayload);
  }
}
