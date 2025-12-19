import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../events/bus.service';
import { Event } from '../events/types';

/**
 * Metrics
 */
export interface Metrics {
  sessionId: string;
  tenantId: string;
  completionRate: number; // 0.0 - 1.0
  deflectionRate: number; // 0.0 - 1.0
  fallbackCount: number;
  toolCallCount: number;
  ragCallCount: number;
  averageResponseTime: number; // ms
  eventCount: number;
  startTime: number;
  endTime?: number;
}

/**
 * Metrics Service
 * 
 * Sammelt KPIs für Analytics
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private metrics: Map<string, Metrics> = new Map();

  constructor(private readonly eventBus: EventBusService) {
    // Subscribe zu Events für Metrics
    this.eventBus.subscribe('*.*', async (event: Event) => {
      await this.updateMetricsFromEvent(event);
    });
  }

  /**
   * Metrics erstellen
   */
  createMetrics(sessionId: string, tenantId: string): Metrics {
    const metrics: Metrics = {
      sessionId,
      tenantId,
      completionRate: 0,
      deflectionRate: 0,
      fallbackCount: 0,
      toolCallCount: 0,
      ragCallCount: 0,
      averageResponseTime: 0,
      eventCount: 0,
      startTime: Date.now(),
    };

    this.metrics.set(sessionId, metrics);
    this.logger.debug(`Metrics created for session: ${sessionId}`);

    return metrics;
  }

  /**
   * Metrics aus Event aktualisieren
   */
  private async updateMetricsFromEvent(event: Event): Promise<void> {
    let metrics = this.metrics.get(event.sessionId);

    if (!metrics) {
      metrics = this.createMetrics(event.sessionId, event.tenantId);
    }

    metrics.eventCount++;

    // Domain-spezifische Metrics
    switch (event.domain) {
      case 'tool':
        metrics.toolCallCount++;
        break;

      case 'knowledge':
        metrics.ragCallCount++;
        break;
    }

    this.metrics.set(event.sessionId, metrics);
  }

  /**
   * Metrics abrufen
   */
  getMetrics(sessionId: string): Metrics | undefined {
    return this.metrics.get(sessionId);
  }

  /**
   * Metrics abschließen
   */
  closeMetrics(sessionId: string): Metrics | undefined {
    const metrics = this.metrics.get(sessionId);
    if (metrics) {
      metrics.endTime = Date.now();
      
      // Berechne Durchschnitts-Response-Time
      if (metrics.eventCount > 0) {
        const duration = metrics.endTime - metrics.startTime;
        metrics.averageResponseTime = duration / metrics.eventCount;
      }

      this.metrics.set(sessionId, metrics);
      this.logger.debug(`Metrics closed for session: ${sessionId}`);
    }
    return metrics;
  }

  /**
   * Metrics nach Tenant filtern
   */
  getMetricsByTenant(tenantId: string): Metrics[] {
    return Array.from(this.metrics.values()).filter((m) => m.tenantId === tenantId);
  }
}

