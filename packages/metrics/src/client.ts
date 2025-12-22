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
    sessionId?: string,
  ): Promise<void> {
    await this.logEvent({
      conversation_id: conversationId,
      session_id: sessionId,
      event: {
        type: 'viseme',
        viseme,
        timestamp,
      },
    });
  }

  /**
   * TTS Event loggen
   */
  async logTts(
    text: string,
    voice: string,
    duration: number,
    latency: number,
    conversationId?: string,
  ): Promise<void> {
    await this.logEvent({
      conversation_id: conversationId,
      event: {
        type: 'tts',
        text,
        voice,
        duration,
        latency,
      },
    });
  }

  /**
   * Error Event loggen
   */
  async logError(
    error: string,
    message: string,
    stack?: string,
    conversationId?: string,
  ): Promise<void> {
    await this.logEvent({
      conversation_id: conversationId,
      event: {
        type: 'error',
        error,
        message,
        stack,
      },
    });
  }

  /**
   * KPI Event loggen
   */
  async logKpi(
    metric: string,
    value: number,
    unit?: string,
    conversationId?: string,
  ): Promise<void> {
    await this.logEvent({
      conversation_id: conversationId,
      event: {
        type: 'kpi',
        metric,
        value,
        unit,
      },
    });
  }
}

