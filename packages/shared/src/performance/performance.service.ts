import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Performance Service
 * 
 * Service für Performance-Monitoring, Profiling und Optimierung
 */
@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private readonly enabled: boolean;
  private readonly metrics: Map<string, { count: number; totalDuration: number; min: number; max: number }> = new Map();

  constructor(private configService?: ConfigService) {
    this.enabled = configService?.get<boolean>('PERFORMANCE_MONITORING_ENABLED', true) ?? true;
  }

  /**
   * Performance-Metrik aufzeichnen
   */
  recordMetric(name: string, duration: number): void {
    if (!this.enabled) {
      return;
    }

    const existing = this.metrics.get(name) || { count: 0, totalDuration: 0, min: Infinity, max: 0 };
    existing.count++;
    existing.totalDuration += duration;
    existing.min = Math.min(existing.min, duration);
    existing.max = Math.max(existing.max, duration);
    this.metrics.set(name, existing);
  }

  /**
   * Durchschnittliche Performance-Metrik abrufen
   */
  getAverageMetric(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric || metric.count === 0) {
      return null;
    }
    return metric.totalDuration / metric.count;
  }

  /**
   * Performance-Report generieren
   */
  getPerformanceReport(): {
    metrics: Array<{
      name: string;
      count: number;
      average: number;
      min: number;
      max: number;
    }>;
  } {
    const report = {
      metrics: Array.from(this.metrics.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        average: data.totalDuration / data.count,
        min: data.min,
        max: data.max,
      })),
    };

    return report;
  }

  /**
   * Performance-Metriken zurücksetzen
   */
  resetMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Performance-Decorator für Methoden
   */
  static measure<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    metricName?: string,
  ): T {
    return (async (...args: any[]) => {
      const start = performance.now();
      const name = metricName || fn.name;
      try {
        const result = await fn(...args);
        const duration = performance.now() - start;
        // In Production: Log to metrics service
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        // In Production: Log error metrics
        throw error;
      }
    }) as T;
  }
}

