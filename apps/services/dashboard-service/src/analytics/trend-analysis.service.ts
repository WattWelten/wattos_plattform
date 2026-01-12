/**
 * Trend Analysis Service
 * 
 * Berechnet Trends und Vergleiche für KPIs über verschiedene Zeiträume
 */

import { Injectable, Logger } from '@nestjs/common';
import { KpiService, KpiResult, KpiRange } from './kpi.service';
import { CacheService } from '@wattweiser/shared';

export interface TrendData {
  metric: string;
  current: number;
  previous: number;
  change: number; // Absolute Änderung
  changePercent: number; // Prozentuale Änderung
  trend: 'up' | 'down' | 'stable'; // Trend-Richtung
  significance: 'high' | 'medium' | 'low'; // Signifikanz der Änderung
}

export interface TrendAnalysisResult {
  tenantId: string;
  range: KpiRange;
  compareRange: KpiRange;
  timestamp: string;
  trends: TrendData[];
  summary: {
    improving: number; // Anzahl verbesserter Metriken
    declining: number; // Anzahl verschlechterter Metriken
    stable: number; // Anzahl stabiler Metriken
  };
}

@Injectable()
export class TrendAnalysisService {
  private readonly logger = new Logger(TrendAnalysisService.name);

  constructor(
    private readonly kpiService: KpiService,
    private readonly cacheService?: CacheService,
  ) {}

  /**
   * Trend-Analyse für KPIs durchführen
   * 
   * Vergleicht aktuelle KPIs mit einem vorherigen Zeitraum
   * 
   * @param tenantId - UUID des Tenants
   * @param range - Aktueller Zeitraum (z.B. '7d')
   * @param compareRange - Vergleichszeitraum (z.B. '30d' für vorherige 7 Tage im 30d-Kontext)
   * @returns Promise<TrendAnalysisResult>
   */
  async analyzeTrends(
    tenantId: string,
    range: KpiRange = '7d',
    compareRange?: KpiRange,
  ): Promise<TrendAnalysisResult> {
    // Bestimme Vergleichszeitraum automatisch, wenn nicht angegeben
    const actualCompareRange = compareRange || this.getCompareRange(range);

    // Cache-Key
    const cacheKey = `trends:${tenantId}:${range}:${actualCompareRange}`;

    // Prüfe Cache
    if (this.cacheService) {
      try {
        const cached = await this.cacheService.get<TrendAnalysisResult>(cacheKey);
        if (cached) {
          this.logger.debug(`Trend cache hit for ${cacheKey}`);
          return cached;
        }
      } catch (error) {
        this.logger.warn(`Cache read error for ${cacheKey}: ${error}`);
      }
    }

    // Lade aktuelle und vorherige KPIs
    const [currentKpis, previousKpis] = await Promise.all([
      this.kpiService.getKpis(tenantId, range),
      this.kpiService.getKpis(tenantId, actualCompareRange),
    ]);

    // Berechne Trends für alle Metriken
    const trends: TrendData[] = [
      this.calculateTrend('answered', currentKpis.answered, previousKpis.answered, 'higher'),
      this.calculateTrend('selfServiceRate', currentKpis.selfServiceRate, previousKpis.selfServiceRate, 'higher'),
      this.calculateTrend('fullySolved', currentKpis.fullySolved, previousKpis.fullySolved, 'higher'),
      this.calculateTrend('timeSavedHours', currentKpis.timeSavedHours, previousKpis.timeSavedHours, 'higher'),
      this.calculateTrend('fteSaved', currentKpis.fteSaved, previousKpis.fteSaved, 'higher'),
      this.calculateTrend('afterHoursPercent', currentKpis.afterHoursPercent, previousKpis.afterHoursPercent, 'lower'), // Niedriger ist besser
      this.calculateTrend('coverageRate', currentKpis.coverageRate, previousKpis.coverageRate, 'higher'),
      this.calculateTrend('p95LatencyMs', currentKpis.p95LatencyMs, previousKpis.p95LatencyMs, 'lower'), // Niedriger ist besser
      this.calculateTrend('csat', currentKpis.csat, previousKpis.csat, 'higher'),
    ];

    // Berechne Summary
    const summary = {
      improving: trends.filter((t) => t.trend === 'up').length,
      declining: trends.filter((t) => t.trend === 'down').length,
      stable: trends.filter((t) => t.trend === 'stable').length,
    };

    const result: TrendAnalysisResult = {
      tenantId,
      range,
      compareRange: actualCompareRange,
      timestamp: new Date().toISOString(),
      trends,
      summary,
    };

    // Cache speichern (TTL: 15 Minuten)
    if (this.cacheService) {
      try {
        await this.cacheService.set(cacheKey, result, 900);
      } catch (error) {
        this.logger.warn(`Cache write error for ${cacheKey}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Berechnet Trend für eine einzelne Metrik
   * 
   * @private
   */
  private calculateTrend(
    metric: string,
    current: number,
    previous: number,
    direction: 'higher' | 'lower',
  ): TrendData {
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

    // Bestimme Trend-Richtung basierend auf gewünschter Richtung
    let trend: 'up' | 'down' | 'stable';
    if (Math.abs(changePercent) < 1) {
      trend = 'stable'; // < 1% Änderung = stabil
    } else if (direction === 'higher') {
      trend = changePercent > 0 ? 'up' : 'down';
    } else {
      trend = changePercent < 0 ? 'up' : 'down'; // Für "lower is better" ist negativer Change = up
    }

    // Bestimme Signifikanz
    const absChangePercent = Math.abs(changePercent);
    let significance: 'high' | 'medium' | 'low';
    if (absChangePercent >= 10) {
      significance = 'high';
    } else if (absChangePercent >= 5) {
      significance = 'medium';
    } else {
      significance = 'low';
    }

    return {
      metric,
      current,
      previous,
      change,
      changePercent: Math.round(changePercent * 100) / 100, // Auf 2 Dezimalstellen runden
      trend,
      significance,
    };
  }

  /**
   * Bestimmt automatisch den Vergleichszeitraum basierend auf dem aktuellen Range
   * 
   * @private
   */
  private getCompareRange(range: KpiRange): KpiRange {
    // Für 'today' vergleichen wir mit gestern (wird als '7d' behandelt, aber nur letzter Tag)
    // Für '7d' vergleichen wir mit vorherigen 7 Tagen (wird als '30d' behandelt, aber nur letzte 7 Tage)
    // Für '30d' vergleichen wir mit vorherigen 30 Tagen (wird als '30d' behandelt, aber nur letzte 30 Tage)
    
    // Vereinfachte Logik: Vergleiche mit demselben Range, aber aus vorherigem Zeitraum
    // In einer echten Implementierung würde man hier historische Daten abrufen
    switch (range) {
      case 'today':
        return '7d'; // Vergleiche mit letztem Tag der letzten 7 Tage
      case '7d':
        return '30d'; // Vergleiche mit vorherigen 7 Tagen (aus 30d-Kontext)
      case '30d':
        return '30d'; // Vergleiche mit vorherigen 30 Tagen (gleicher Range, aber historisch)
      default:
        return '7d';
    }
  }

  /**
   * Zeitreihen-Daten für Chart-Darstellung
   * 
   * Gibt historische KPI-Werte für einen Zeitraum zurück
   */
  async getTimeSeries(
    tenantId: string,
    metric: keyof KpiResult,
    range: KpiRange = '30d',
    granularity: 'day' | 'week' = 'day',
  ): Promise<Array<{ date: string; value: number }>> {
    // Cache-Key
    const cacheKey = `timeseries:${tenantId}:${metric}:${range}:${granularity}`;

    // Prüfe Cache
    if (this.cacheService) {
      try {
        const cached = await this.cacheService.get<Array<{ date: string; value: number }>>(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (error) {
        this.logger.warn(`Cache read error for ${cacheKey}: ${error}`);
      }
    }

    // TODO: Implementiere echte Zeitreihen-Abfrage aus der Datenbank
    // Für jetzt: Mock-Daten basierend auf aktuellen KPIs
    const kpis = await this.kpiService.getKpis(tenantId, range);
    const currentValue = kpis[metric] as number;

    // Generiere Mock-Zeitreihen (in Produktion: echte DB-Abfrage)
    const days = range === '30d' ? 30 : range === '7d' ? 7 : 1;
    const data: Array<{ date: string; value: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // Simuliere Variation (±20%)
      const variation = 1 + (Math.random() - 0.5) * 0.4;
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(currentValue * variation * 100) / 100,
      });
    }

    // Cache speichern (TTL: 5 Minuten)
    if (this.cacheService) {
      try {
        await this.cacheService.set(cacheKey, data, 300);
      } catch (error) {
        this.logger.warn(`Cache write error for ${cacheKey}: ${error}`);
      }
    }

    return data;
  }
}
