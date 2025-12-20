import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../events/bus.service';
import { Event } from '../events/types';

/**
 * Event Trace
 */
export interface EventTrace {
  sessionId: string;
  tenantId: string;
  events: Event[];
  startTime: number;
  endTime?: number | undefined;
  metadata?: Record<string, any> | undefined;
}

/**
 * Trace Service
 * 
 * Verwaltet Event-Traces pro Konversation für Replay-Fähigkeit
 */
@Injectable()
export class TraceService {
  private readonly logger = new Logger(TraceService.name);
  private traces: Map<string, EventTrace> = new Map();
  private maxTraceSize = 10000; // Max. Events pro Trace

  constructor(private readonly eventBus: EventBusService) {
    // Subscribe zu allen Events für Tracing
    this.eventBus.subscribe('*.*', async (event: Event) => {
      await this.addEventToTrace(event);
    });
  }

  /**
   * Trace erstellen
   */
  createTrace(sessionId: string, tenantId: string, metadata?: Record<string, any>): EventTrace {
    const trace: EventTrace = {
      sessionId,
      tenantId,
      events: [],
      startTime: Date.now(),
      metadata: metadata ?? undefined,
    };

    this.traces.set(sessionId, trace);
    this.logger.debug(`Trace created for session: ${sessionId}`);

    return trace;
  }

  /**
   * Event zu Trace hinzufügen
   */
  private async addEventToTrace(event: Event): Promise<void> {
    let trace = this.traces.get(event.sessionId);

    if (!trace) {
      trace = this.createTrace(event.sessionId, event.tenantId);
    }

    // Prüfe Max-Size
    if (trace.events.length >= this.maxTraceSize) {
      this.logger.warn(`Trace size limit reached for session: ${event.sessionId}`);
      return;
    }

    trace.events.push(event);
    this.traces.set(event.sessionId, trace);
  }

  /**
   * Trace abrufen
   */
  getTrace(sessionId: string): EventTrace | undefined {
    return this.traces.get(sessionId);
  }

  /**
   * Trace abschließen
   */
  closeTrace(sessionId: string): EventTrace | undefined {
    const trace = this.traces.get(sessionId);
    if (trace) {
      trace.endTime = Date.now();
      this.traces.set(sessionId, trace);
      this.logger.debug(`Trace closed for session: ${sessionId}`);
    }
    return trace;
  }

  /**
   * Trace löschen
   */
  deleteTrace(sessionId: string): void {
    this.traces.delete(sessionId);
    this.logger.debug(`Trace deleted for session: ${sessionId}`);
  }

  /**
   * Trace replayen
   */
  async replayTrace(sessionId: string): Promise<void> {
    const trace = this.getTrace(sessionId);
    if (!trace) {
      throw new Error(`Trace not found: ${sessionId}`);
    }

    this.logger.log(`Replaying trace for session: ${sessionId}`, {
      eventCount: trace.events.length,
    });

    // Emit Events in Reihenfolge
    for (const event of trace.events) {
      await this.eventBus.emit(event);
      // Kleine Delay für bessere Nachvollziehbarkeit
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}

