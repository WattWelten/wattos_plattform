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

    await this.service.persistEvent({
      tenant_id: tenantId,
      conversation_id: (payload as EventPayload).conversation_id,
      session_id: (payload as EventPayload).session_id,
      event: validated,
      metadata: (payload as EventPayload).metadata,
    });
  }
}

