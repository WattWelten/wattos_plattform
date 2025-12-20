import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Metrics Service
 * Prometheus-kompatible Metriken-Sammlung
 * 
 * In Produktion sollte ein echter Prometheus Client verwendet werden,
 * hier eine einfache In-Memory-Implementierung für den Start
 */
export interface MetricLabels {
  [key: string]: string | number;
}

export interface CounterMetric {
  name: string;
  value: number;
  labels: MetricLabels;
}

export interface HistogramMetric {
  name: string;
  buckets: number[];
  labels: MetricLabels;
}

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private counters: Map<string, Map<string, number>> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private gauges: Map<string, number> = new Map();
  private readonly enabled: boolean;
  private readonly maxHistogramSize: number;

  constructor(private configService?: ConfigService) {
    this.enabled = configService?.get<boolean>('METRICS_ENABLED', true) ?? true;
    this.maxHistogramSize = configService?.get<number>('METRICS_MAX_HISTOGRAM_SIZE', 1000) ?? 1000;
  }

  onModuleInit() {
    if (this.enabled) {
      this.logger.log('Metrics Service initialized');
    }
  }

  /**
   * Counter erhöhen
   */
  incrementCounter(name: string, labels: MetricLabels = {}, value: number = 1): void {
    if (!this.enabled) return;

    const key = this.createKey(name, labels);
    const current = this.counters.get(key) || new Map();
    const labelKey = JSON.stringify(labels);
    const currentValue = current.get(labelKey) || 0;
    current.set(labelKey, currentValue + value);
    this.counters.set(key, current);
  }

  /**
   * Histogram-Wert aufzeichnen
   */
  recordHistogram(name: string, value: number, labels: MetricLabels = {}): void {
    if (!this.enabled) return;

    const key = this.createKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);

    // Rotation: Älteste Werte entfernen wenn Limit erreicht
    if (values.length > this.maxHistogramSize) {
      values.shift(); // FIFO: Entferne ältesten Wert
    }

    this.histograms.set(key, values);
  }

  /**
   * Gauge setzen
   */
  setGauge(name: string, value: number, labels: MetricLabels = {}): void {
    if (!this.enabled) return;

    const key = this.createKey(name, labels);
    this.gauges.set(key, value);
  }

  /**
   * HTTP Request Metrik
   */
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.incrementCounter('http_requests_total', {
      method,
      route: this.normalizeRoute(route),
      status_code: statusCode,
    });

    this.recordHistogram('http_request_duration_ms', duration, {
      method,
      route: this.normalizeRoute(route),
      status_code: statusCode,
    });
  }

  /**
   * LLM Call Metrik
   */
  recordLlmCall(provider: string, model: string, tokens: number, cost: number, duration: number): void {
    this.incrementCounter('llm_calls_total', { provider, model });
    this.recordHistogram('llm_tokens_total', tokens, { provider, model });
    this.recordHistogram('llm_cost_usd', cost, { provider, model });
    this.recordHistogram('llm_call_duration_ms', duration, { provider, model });
  }

  /**
   * Database Query Metrik
   */
  recordDbQuery(operation: string, duration: number, success: boolean): void {
    this.incrementCounter('db_queries_total', { operation, success: success.toString() });
    this.recordHistogram('db_query_duration_ms', duration, { operation });
  }

  /**
   * Cache Hit/Miss Metrik
   */
  recordCacheOperation(operation: 'hit' | 'miss' | 'set', cacheKey: string): void {
    this.incrementCounter('cache_operations_total', { operation, cache_key: this.normalizeRoute(cacheKey) });
  }

  /**
   * Metriken im Prometheus-Format exportieren
   */
  exportPrometheus(): string {
    if (!this.enabled) {
      return '# Metrics disabled\n';
    }

    const lines: string[] = [];

    // Counters
    for (const [key, counterMap] of this.counters.entries()) {
      for (const [labelKey, value] of counterMap.entries()) {
        const labels = JSON.parse(labelKey);
        const labelString = this.formatLabels(labels);
        lines.push(`${key}${labelString} ${value}`);
      }
    }

    // Histograms (vereinfacht - nur Sum und Count)
    for (const [key, values] of this.histograms.entries()) {
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      lines.push(`${key}_sum ${sum}`);
      lines.push(`${key}_count ${count}`);
      if (count > 0) {
        lines.push(`${key}_avg ${sum / count}`);
      }
    }

    // Gauges
    for (const [key, value] of this.gauges.entries()) {
      lines.push(`${key} ${value}`);
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Metriken zurücksetzen (für Tests)
   */
  reset(): void {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
  }

  private createKey(name: string, labels: MetricLabels): string {
    const labelString = Object.keys(labels).length > 0 ? JSON.stringify(labels) : '';
    return `${name}${labelString}`;
  }

  private formatLabels(labels: MetricLabels): string {
    const labelPairs = Object.entries(labels).map(([key, value]) => `${key}="${value}"`);
    return labelPairs.length > 0 ? `{${labelPairs.join(',')}}` : '';
  }

  private normalizeRoute(route: string): string {
    // Normalisiere Route für Metriken (z.B. /api/users/123 -> /api/users/:id)
    return route.replace(/\/\d+/g, '/:id').replace(/\/[a-f0-9-]{36}/gi, '/:uuid');
  }
}










