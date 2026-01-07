/**
 * Metrics Client SDK für Frontend
 */

import type { EventPayload } from './types';

export class MetricsClient {
  private baseUrl: string;
  private tenantId: string;

  constructor(baseUrl: string, tenantId: string) {
    this.baseUrl = baseUrl;
    this.tenantId = tenantId;
  }

  /**
   * Event an Server senden
   */
  async logEvent(payload: Omit<EventPayload, 'tenant_id'>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          tenant_id: this.tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to log event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to log event:', error);
      // Non-blocking: Fehler nicht weiterwerfen
    }
  }

  /**
   * Viseme Event loggen
   */
  async logViseme(
    viseme: 'MBP' | 'FV' | 'TH' | 'AA',
    timestamp: number,
    conversationId?: string,
    sessionId?: string
  ): Promise<void> {
    const payload: Omit<EventPayload, 'tenant_id'> = {
      event: {
        type: 'viseme',
        viseme,
        timestamp,
      },
    };
    if (conversationId) payload.conversation_id = conversationId;
    if (sessionId) payload.session_id = sessionId;
    await this.logEvent(payload);
  }

  /**
   * TTS Event loggen
   */
  async logTts(
    text: string,
    voice: string,
    duration: number,
    latency: number,
    conversationId?: string
  ): Promise<void> {
    const payload: Omit<EventPayload, 'tenant_id'> = {
      event: {
        type: 'tts',
        text,
        voice,
        duration,
        latency,
      },
    };
    if (conversationId) payload.conversation_id = conversationId;
    await this.logEvent(payload);
  }

  /**
   * Error Event loggen
   */
  async logError(
    error: string,
    message: string,
    stack?: string,
    conversationId?: string
  ): Promise<void> {
    const payload: Omit<EventPayload, 'tenant_id'> = {
      event: {
        type: 'error',
        error,
        message,
        ...(stack && { stack }),
      },
    };
    if (conversationId) payload.conversation_id = conversationId;
    await this.logEvent(payload);
  }

  /**
   * KPI Event loggen
   */
  async logKpi(
    metric: string,
    value: number,
    unit?: string,
    conversationId?: string
  ): Promise<void> {
    const payload: Omit<EventPayload, 'tenant_id'> = {
      event: {
        type: 'kpi',
        metric,
        value,
        ...(unit && { unit }),
      },
    };
    if (conversationId) payload.conversation_id = conversationId;
    await this.logEvent(payload);
  }
}
