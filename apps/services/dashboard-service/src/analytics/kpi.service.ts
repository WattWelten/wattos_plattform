/**
 * KPI Service für Multi-Tenant Analytics
 * 
 * Berechnet 8 KPIs für ICP Kommune/Schule:
 * 1. Anzahl beantworteter Anfragen
 * 2. Self-Service-Quote
 * 3. Vollständig gelöst
 * 4. Zeitersparnis (h)
 * 5. FTE-Ersparnis
 * 6. Außerhalb Öffnungszeiten
 * 7. Top-5 Themen
 * 8. Abdeckungsgrad
 */

import { Injectable, Logger, Inject, Optional, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { CacheService } from '@wattweiser/shared';
import { TenantSettings } from '../common/interfaces/tenant-settings.interface';

export type KpiRange = 'today' | '7d' | '30d';

export interface KpiResult {
  answered: number;
  selfServiceRate: number;
  fullySolved: number;
  timeSavedHours: number;
  fteSaved: number;
  afterHoursPercent: number;
  topTopics: Array<{ topic: string; count: number }>;
  coverageRate: number;
  p95LatencyMs: number;
  csat: number;
}

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);
  private readonly cacheEnabled: boolean;

  // Cache-Metriken
  private cacheHits = 0;
  private cacheMisses = 0;
  private queryDurations: Map<string, number[]> = new Map(); // KPI-Methode -> [durations in ms]
  private viewFallbacks = 0; // Anzahl der View-Fallbacks

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CacheService) private readonly cacheService?: CacheService,
  ) {
    this.cacheEnabled = !!this.cacheService;
  }

  /**
   * Zeitraum in Start- und End-Datum umwandeln
   * 
   * today: Heute (00:00:00 bis jetzt)
   * 7d: Letzte 7 Tage inkl. heute (6 Tage zurück + heute)
   * 30d: Letzte 30 Tage inkl. heute (29 Tage zurück + heute)
   */
  private rangeToDates(range: KpiRange): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (range === '7d') {
      // 7d = 6 Tage zurück + heute
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (range === '30d') {
      // 30d = 29 Tage zurück + heute
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }

    return { start, end };
  }

  /**
   * Misst Query-Dauer für Performance-Monitoring
   * @private
   */
  private async measureQueryDuration<T>(method: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.recordQueryDuration(method, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordQueryDuration(method, duration);
      throw error;
    }
  }

  /**
   * Zeichnet Query-Dauer auf
   * @private
   */
  private recordQueryDuration(method: string, duration: number): void {
    if (!this.queryDurations.has(method)) {
      this.queryDurations.set(method, []);
    }
    const durations = this.queryDurations.get(method)!;
    durations.push(duration);
    // Behalte nur die letzten 1000 Messungen pro Methode
    if (durations.length > 1000) {
      durations.shift();
    }
  }

  /**
   * Zeichnet View-Fallback auf
   * @private
   */
  private recordViewFallback(): void {
    this.viewFallbacks++;
  }

  /**
   * Berechnet alle KPIs für einen Tenant
   * 
   * @param tenantId - UUID des Tenants
   * @param range - Zeitraum: 'today', '7d' (letzte 7 Tage), oder '30d' (letzte 30 Tage). Default: '7d'
   * @returns Promise<KpiResult> - Objekt mit allen berechneten KPIs
   * 
   * @example
   * ```typescript
   * const kpis = await kpiService.getKpis('tenant-uuid', '7d');
   * console.log(kpis.answered); // Anzahl beantworteter Anfragen
   * console.log(kpis.csat); // Customer Satisfaction Score
   * ```
   * 
   * @throws {BadRequestException} Wenn tenantId kein gültiges UUID-Format hat
   * 
   * @remarks
   * - Verwendet Redis-Caching für Performance (TTL: 5-30 Minuten je nach Range)
   * - Cache-Key: `kpi:{tenantId}:{range}`
   * - Bei Cache-Miss werden alle KPIs parallel berechnet
   * - Nutzt SQL Views für Performance, fällt bei Fehlern auf direkte Queries zurück
   */
  async getKpis(tenantId: string, range: KpiRange = '7d'): Promise<KpiResult> {
    this.validateTenantId(tenantId);

    // Cache-Key: kpi:{tenantId}:{range}
    const cacheKey = `kpi:${tenantId}:${range}`;

    // 1. Prüfe Cache
    if (this.cacheEnabled && this.cacheService) {
      try {
        const cached = await this.cacheService.get<KpiResult>(cacheKey);
        if (cached) {
          this.cacheHits++;
          this.logger.debug(`KPI cache hit for ${cacheKey}`);
          return cached;
        }
        this.cacheMisses++;
      } catch (error) {
        this.cacheMisses++;
        this.logger.warn(`Cache read error for ${cacheKey}: ${error}`);
      }
    } else {
      this.cacheMisses++;
    }

    // 2. Berechne KPIs (Cache Miss)
    const calculationStart = Date.now();
    const { start, end } = this.rangeToDates(range);

    // 1. Anzahl beantworteter Anfragen
    const answered = await this.measureQueryDuration('answered', () => 
      this.getAnsweredCount(tenantId, start, end)
    );

    // 2. Self-Service-Quote
    const selfServiceRate = await this.measureQueryDuration('selfServiceRate', () => 
      this.getSelfServiceRate(tenantId, start, end)
    );

    // 3. Vollständig gelöst
    const fullySolved = await this.measureQueryDuration('fullySolved', () => 
      this.getFullySolvedCount(tenantId, start, end)
    );

    // 4. & 5. Zeitersparnis und FTE-Ersparnis
    const { timeSavedHours, fteSaved } = await this.measureQueryDuration('timeSaved', async () => 
      this.getTimeSaved(tenantId, start, end)
    );

    // 6. Außerhalb Öffnungszeiten
    const afterHoursPercent = await this.measureQueryDuration('afterHours', () => 
      this.getAfterHoursPercent(tenantId, start, end)
    );

    // 7. Top-5 Themen
    const topTopics = await this.measureQueryDuration('topTopics', () => 
      this.getTopTopics(tenantId, start, end, 5)
    );

    // 8. Abdeckungsgrad
    const coverageRate = await this.measureQueryDuration('coverageRate', () => 
      this.getCoverageRate(tenantId, start, end)
    );

    // Zusätzliche Metriken
    const p95LatencyMs = await this.measureQueryDuration('p95Latency', () => 
      this.getP95Latency(tenantId, start, end)
    );
    const csat = await this.measureQueryDuration('csat', () => 
      this.getCsat(tenantId, start, end)
    );

    const totalDuration = Date.now() - calculationStart;
    this.recordQueryDuration('total', totalDuration);

    const result: KpiResult = {
      answered,
      selfServiceRate,
      fullySolved,
      timeSavedHours,
      fteSaved,
      afterHoursPercent,
      topTopics,
      coverageRate,
      p95LatencyMs,
      csat,
    };

    // 3. Speichere im Cache
    if (this.cacheEnabled && this.cacheService) {
      try {
        // Cache TTL basierend auf Range: today=5min, 7d=15min, 30d=30min
        const ttl = range === 'today' ? 300 : range === '7d' ? 900 : 1800;
        await this.cacheService.set(cacheKey, result, ttl);
        this.logger.debug(`KPI cached for ${cacheKey} (TTL: ${ttl}s)`);
      } catch (error) {
        this.logger.warn(`Cache write error for ${cacheKey}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Validiere Tenant-ID (UUID-Format)
   */
  private validateTenantId(tenantId: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      throw new BadRequestException(`Invalid tenant ID format: ${tenantId}`);
    }
  }

  /**
   * 1. Anzahl beantworteter Anfragen
   * Nutzt vw_kpi_answered View für bessere Performance
   * Fallback auf direkte Query bei View-Fehler
   */
  private async getAnsweredCount(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    this.validateTenantId(tenantId);
    try {
      // Nutze View für bessere Performance (aggregiert pro Tag)
      const result = await this.prisma.client.$queryRaw<Array<{ answered: bigint }>>`
        SELECT COALESCE(sum(answered), 0)::int AS answered
        FROM vw_kpi_answered
        WHERE tenant_id = ${tenantId}::text
          AND d BETWEEN date_trunc('day', ${start}::timestamp) AND date_trunc('day', ${end}::timestamp)
      `;
      return Number(result?.[0]?.answered ?? 0);
        } catch (error) {
          this.recordViewFallback();
          this.logger.warn(`View query failed for getAnsweredCount, falling back to direct query: ${error instanceof Error ? error.message : String(error)}`);
          // Fallback: Direkte Query
      const result = await this.prisma.client.$queryRaw<Array<{ answered: bigint }>>`
        SELECT count(*)::int AS answered
        FROM "ConversationMessage" a
        JOIN "Conversation" i ON i.id = a."conversationId"
        WHERE i."tenantId" = ${tenantId}::text
          AND a.role = 'assistant'
          AND a."createdAt" BETWEEN ${start} AND ${end}
      `;
      return Number(result?.[0]?.answered ?? 0);
    }
  }

  /**
   * 2. Self-Service-Quote
   * Nutzt vw_kpi_self_service View für bessere Performance
   * Fallback auf direkte Query bei View-Fehler
   */
  private async getSelfServiceRate(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    this.validateTenantId(tenantId);
    try {
      // Nutze View für bessere Performance (aggregiert pro Tag)
      const result = await this.prisma.client.$queryRaw<Array<{ rate: number }>>`
        SELECT COALESCE(avg(self_service_rate), 0) AS rate
        FROM vw_kpi_self_service
        WHERE tenant_id = ${tenantId}::text
          AND d BETWEEN date_trunc('day', ${start}::timestamp) AND date_trunc('day', ${end}::timestamp)
      `;
      return Number(result?.[0]?.rate ?? 0);
    } catch (error) {
      this.recordViewFallback();
      this.logger.warn(`View query failed for getSelfServiceRate, falling back to direct query: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback: Direkte Query
      const result = await this.prisma.client.$queryRaw<Array<{ rate: number }>>`
        SELECT COALESCE(avg(CASE WHEN a.solved THEN 1 ELSE 0 END), 0)::numeric(5,2) AS rate
        FROM "ConversationMessage" a
        JOIN "Conversation" i ON i.id = a."conversationId"
        WHERE i."tenantId" = ${tenantId}::text
          AND a.role = 'assistant'
          AND a."createdAt" BETWEEN ${start} AND ${end}
      `;
      return Number(result?.[0]?.rate ?? 0);
    }
  }

  /**
   * 3. Vollständig gelöst
   * Nutzt vw_kpi_self_service View für bessere Performance
   * Fallback auf direkte Query bei View-Fehler
   */
  private async getFullySolvedCount(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    this.validateTenantId(tenantId);
    try {
      // Nutze View für bessere Performance (aggregiert pro Tag)
      const result = await this.prisma.client.$queryRaw<Array<{ solved: bigint }>>`
        SELECT COALESCE(sum(solved_count), 0)::int AS solved
        FROM vw_kpi_self_service
        WHERE tenant_id = ${tenantId}::text
          AND d BETWEEN date_trunc('day', ${start}::timestamp) AND date_trunc('day', ${end}::timestamp)
      `;
      return Number(result?.[0]?.solved ?? 0);
    } catch (error) {
      this.recordViewFallback();
      this.logger.warn(`View query failed for getFullySolvedCount, falling back to direct query: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback: Direkte Query
      const result = await this.prisma.client.$queryRaw<Array<{ solved: bigint }>>`
        SELECT count(*)::int AS solved
        FROM "ConversationMessage" a 
        JOIN "Conversation" i ON i.id = a."conversationId"
        WHERE i."tenantId" = ${tenantId}::text
          AND a.role = 'assistant'
          AND a.solved = true
          AND a."createdAt" BETWEEN ${start} AND ${end}
      `;
      return Number(result?.[0]?.solved ?? 0);
    }
  }

  /**
   * 4. & 5. Zeitersparnis und FTE-Ersparnis
   */
  private async getTimeSaved(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<{ timeSavedHours: number; fteSaved: number }> {
    // Hole avgHandleTimeMin aus Tenant-Settings (Standard: 10 Minuten)
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const settings = (tenant?.settings as TenantSettings) || {};
    const metrics = settings.metrics || {};
    const avgHandleTimeMin = metrics.avgHandleTimeMin?.default || 10;

    const solvedCount = await this.getFullySolvedCount(tenantId, start, end);
    const timeSavedHours = (solvedCount * avgHandleTimeMin) / 60;
    const fteSaved = timeSavedHours / 160; // 160 Stunden = 1 FTE/Monat

    return { timeSavedHours, fteSaved };
  }

  /**
   * 6. Außerhalb Öffnungszeiten (Prozent)
   * Nutzt vw_kpi_after_hours View für bessere Performance
   * Fallback auf direkte Query bei View-Fehler
   */
  private async getAfterHoursPercent(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    this.validateTenantId(tenantId);
    try {
      // Nutze View für bessere Performance (aggregiert pro Tag)
      // View enthält weekend_count, after_hours_count, total_queries
      // View nutzt Standard 8-18 Uhr, aber wir müssen Tenant-Config berücksichtigen
      // Für jetzt nutzen wir die View und berechnen den Prozentsatz
      // TODO: Tenant-spezifische Öffnungszeiten in View-Query integrieren
      // (könnte tenant.settings.officeHours verwenden, aber View nutzt aktuell Standard-Werte)
      const result = await this.prisma.client.$queryRaw<Array<{ after_hours_pct: number }>>`
        SELECT 
          CASE 
            WHEN COALESCE(sum(total_queries), 0) = 0 THEN 0
            ELSE 100.0 * (COALESCE(sum(weekend_count), 0) + COALESCE(sum(after_hours_count), 0)) / sum(total_queries)
          END AS after_hours_pct
        FROM vw_kpi_after_hours
        WHERE tenant_id = ${tenantId}::text
          AND d BETWEEN date_trunc('day', ${start}::timestamp) AND date_trunc('day', ${end}::timestamp)
      `;
      return Number(result?.[0]?.after_hours_pct ?? 0);
    } catch (error) {
      this.recordViewFallback();
      this.logger.warn(`View query failed for getAfterHoursPercent, falling back to direct query: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback: Direkte Query mit Tenant-Config
      const tenant = await this.prisma.client.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
      });

    const settings = (tenant?.settings as TenantSettings) || {};
      const officeHours = settings.officeHours || { open: 8, close: 18 };
      const openHour = officeHours.open || 8;
      const closeHour = officeHours.close || 18;

      const result = await this.prisma.client.$queryRaw<Array<{ after_hours_pct: number }>>`
        WITH q AS (
          SELECT m.* 
          FROM "ConversationMessage" m 
          JOIN "Conversation" i ON i.id = m."conversationId"
          WHERE i."tenantId" = ${tenantId}::text
            AND m.role = 'user'
            AND m."createdAt" BETWEEN ${start} AND ${end}
        )
        SELECT 
          CASE 
            WHEN count(*) = 0 THEN 0
            ELSE 100.0 * sum(CASE
              WHEN EXTRACT(ISODOW FROM q."createdAt") IN (6, 0) THEN 1
              WHEN EXTRACT(HOUR FROM q."createdAt")::int NOT BETWEEN ${openHour} AND ${closeHour} THEN 1
              ELSE 0
            END) / count(*)
          END AS after_hours_pct
        FROM q
      `;
      return Number(result?.[0]?.after_hours_pct ?? 0);
    }
  }

  /**
   * 7. Top-N Themen
   * Nutzt vw_kpi_top_topics View für bessere Performance
   * Fallback auf direkte Query bei View-Fehler
   */
  private async getTopTopics(
    tenantId: string,
    start: Date,
    end: Date,
    limit: number = 5,
  ): Promise<Array<{ topic: string; count: number }>> {
    this.validateTenantId(tenantId);
    try {
      // Nutze View für bessere Performance (aggregiert pro Tag, dann summiert)
      const result = await this.prisma.client.$queryRaw<Array<{ topic: string; count: bigint }>>`
        SELECT 
          topic,
          sum(count)::int AS count
        FROM vw_kpi_top_topics
        WHERE tenant_id = ${tenantId}::text
          AND d BETWEEN date_trunc('day', ${start}::timestamp) AND date_trunc('day', ${end}::timestamp)
        GROUP BY topic
        ORDER BY count DESC
        LIMIT ${limit}
      `;
      return result.map((r: { topic: string; count: bigint }) => ({
        topic: r.topic || 'Unknown',
        count: Number(r.count),
      }));
    } catch (error) {
      this.recordViewFallback();
      this.logger.warn(`View query failed for getTopTopics, falling back to direct query: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback: Direkte Query
      const result = await this.prisma.client.$queryRaw<Array<{ topic: string; count: bigint }>>`
        SELECT 
          payloadJsonb->>'topic' AS topic,
          count(*)::int AS count
        FROM "Event"
        WHERE "tenantId" = ${tenantId}::text
          AND type = 'chat.asked'
          AND payloadJsonb->>'topic' IS NOT NULL
          AND ts BETWEEN ${start} AND ${end}
        GROUP BY payloadJsonb->>'topic'
        ORDER BY count DESC
        LIMIT ${limit}
      `;
      return result.map((r: { topic: string; count: bigint }) => ({
        topic: r.topic || 'Unknown',
        count: Number(r.count),
      }));
    }
  }

  /**
   * 8. Abdeckungsgrad (Anteil Top-N-Themen mit quality>=good)
   * Nutzt parameterized Query für Sicherheit
   */
  private async getCoverageRate(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    // Hole Top-5 Themen
    const topTopics = await this.getTopTopics(tenantId, start, end, 5);
    if (topTopics.length === 0) return 0;

    const topicNames = topTopics.map((t) => t.topic);

    // Validiere Topic-Namen (nur alphanumerisch, Bindestrich, Unterstrich, Leerzeichen, max 100 Zeichen)
    const validTopicNames = topicNames.filter((topic) => {
      return typeof topic === 'string' && /^[a-zA-Z0-9\s\-_]+$/.test(topic) && topic.length <= 100;
    });

    if (validTopicNames.length === 0) return 0;

    // Verwende Prisma $queryRaw mit IN-Clause statt ANY für bessere Sicherheit
    // Da Prisma $queryRaw keine dynamischen Arrays unterstützt, verwenden wir IN mit einzelnen Parametern
    try {
      // Baue IN-Clause mit einzelnen parametrisierten Werten
      // Jeder Topic-Name wird einzeln parametrisiert
      const topicPlaceholders = validTopicNames.map((_, i) => `$${i + 2}`).join(', ');
      
      // Verwende $queryRawUnsafe mit validierten Parametern
      // Alle Inputs sind validiert: tenantId (UUID), validTopicNames (alphanumerisch, max 100 Zeichen)
      const query = `WITH topic_events AS (
        SELECT 
          e.payloadJsonb->>'topic' AS topic,
          e.payloadJsonb->>'queryId' AS query_id
        FROM "Event" e
        WHERE e."tenantId" = $1::text
          AND e.type = 'chat.asked'
          AND e.payloadJsonb->>'topic' IN (${topicPlaceholders})
          AND e.ts BETWEEN $${validTopicNames.length + 2} AND $${validTopicNames.length + 3}
      )
      SELECT 
        count(*) FILTER (WHERE quality_good = true)::int AS good_count,
        count(*)::int AS total_count
      FROM (
        SELECT 
          te.topic,
          CASE 
            WHEN f.type IN ('STAR4', 'STAR5', 'UP') THEN true
            WHEN a.solved = true THEN true
            ELSE false
          END AS quality_good
        FROM topic_events te
        LEFT JOIN "ConversationMessage" a ON a.id::text = te.query_id
        LEFT JOIN "Feedback" f ON f."queryId" = a.id
      ) q`;

      const params: any[] = [tenantId, ...validTopicNames, start, end];
      const result = await this.prisma.client.$queryRawUnsafe<Array<{ good_count: bigint; total_count: bigint }>>(
        query,
        ...params,
      );

      const goodCount = Number(result?.[0]?.good_count ?? 0);
      const totalCount = Number(result?.[0]?.total_count ?? 0);

      return totalCount > 0 ? (goodCount / totalCount) * 100 : 0;
    } catch (error) {
      this.logger.warn(`Failed to calculate coverage rate: ${error instanceof Error ? error.message : String(error)}`);
      return 0;
    }
  }

  /**
   * P95 Latenz
   * Nutzt vw_kpi_p95_latency View für bessere Performance
   * Fallback auf direkte Query bei View-Fehler
   */
  private async getP95Latency(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    this.validateTenantId(tenantId);
    try {
      // Nutze View für bessere Performance (aggregiert pro Tag, dann P95 über alle Tage)
      const result = await this.prisma.client.$queryRaw<Array<{ p95: number }>>`
        SELECT COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY p95_latency), 0) AS p95
        FROM vw_kpi_p95_latency
        WHERE tenant_id = ${tenantId}::text
          AND d BETWEEN date_trunc('day', ${start}::timestamp) AND date_trunc('day', ${end}::timestamp)
      `;
      return Number(result?.[0]?.p95 ?? 0);
    } catch (error) {
      this.recordViewFallback();
      this.logger.warn(`View query failed for getP95Latency, falling back to direct query: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback: Direkte Query
      const result = await this.prisma.client.$queryRaw<Array<{ p95: number }>>`
        SELECT COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY a."latencyMs"), 0) AS p95
        FROM "ConversationMessage" a
        JOIN "Conversation" i ON i.id = a."conversationId"
        WHERE i."tenantId" = ${tenantId}::text
          AND a.role = 'assistant'
          AND a."latencyMs" IS NOT NULL
          AND a."createdAt" BETWEEN ${start} AND ${end}
      `;
      return Number(result?.[0]?.p95 ?? 0);
    }
  }

  /**
   * CSAT (Customer Satisfaction)
   * Nutzt vw_kpi_csat View für bessere Performance
   * Fallback auf direkte Query bei View-Fehler
   */
  private async getCsat(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    this.validateTenantId(tenantId);
    try {
      // Nutze View für bessere Performance (aggregiert pro Tag)
      const result = await this.prisma.client.$queryRaw<Array<{ csat: number }>>`
        SELECT COALESCE(round(avg(csat)::numeric, 2), 0) AS csat
        FROM vw_kpi_csat
        WHERE tenant_id = ${tenantId}::text
          AND d BETWEEN date_trunc('day', ${start}::timestamp) AND date_trunc('day', ${end}::timestamp)
      `;
      return Number(result?.[0]?.csat ?? 0);
    } catch (error) {
      this.recordViewFallback();
      this.logger.warn(`View query failed for getCsat, falling back to direct query: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback: Direkte Query
      const result = await this.prisma.client.$queryRaw<Array<{ csat: number }>>`
        SELECT COALESCE(round(avg(CASE
          WHEN type IN ('STAR5', 'UP') THEN 5
          WHEN type = 'STAR4' THEN 4
          WHEN type = 'STAR3' THEN 3
          WHEN type = 'STAR2' THEN 2
          WHEN type IN ('STAR1', 'DOWN') THEN 1
        END)::numeric, 2), 0) AS csat
        FROM "Feedback"
        WHERE "tenantId" = ${tenantId}::text
          AND "createdAt" BETWEEN ${start} AND ${end}
      `;
      return Number(result?.[0]?.csat ?? 0);
    }
  }

  /**
   * Gibt Cache-Metriken zurück für Monitoring
   * 
   * @returns Cache-Hit-Rate, Query-Dauern, View-Fallbacks
   * 
   * @example
   * ```typescript
   * const metrics = await kpiService.getCacheMetrics();
   * console.log(metrics.cacheHitRate); // 0.85 (85% Hit-Rate)
   * console.log(metrics.queryDurations.answered.avg); // Durchschnittliche Query-Dauer
   * ```
   */
  getCacheMetrics(): {
    cacheHitRate: number;
    cacheHits: number;
    cacheMisses: number;
    queryDurations: Record<string, { avg: number; p50: number; p95: number; p99: number; count: number }>;
    viewFallbacks: number;
  } {
    const total = this.cacheHits + this.cacheMisses;
    const cacheHitRate = total > 0 ? this.cacheHits / total : 0;

    const queryDurations: Record<string, { avg: number; p50: number; p95: number; p99: number; count: number }> = {};
    for (const [method, durations] of this.queryDurations.entries()) {
      if (durations.length === 0) continue;
      const sorted = [...durations].sort((a, b) => a - b);
      const count = sorted.length;
      const sum = sorted.reduce((a, b) => a + b, 0);
      const avg = sum / count;
      const p50Index = Math.floor(count * 0.5);
      const p95Index = Math.floor(count * 0.95);
      const p99Index = Math.floor(count * 0.99);
      const p50 = sorted[p50Index] ?? 0;
      const p95 = sorted[p95Index] ?? 0;
      const p99 = sorted[p99Index] ?? 0;

      queryDurations[method] = { avg, p50, p95, p99, count };
    }

    return {
      cacheHitRate,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      queryDurations,
      viewFallbacks: this.viewFallbacks,
    };
  }
}
