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

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';

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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Zeitraum in Start- und End-Datum umwandeln
   */
  private rangeToDates(range: KpiRange): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (range === '7d') {
      start.setDate(now.getDate() - 7);
    } else if (range === '30d') {
      start.setDate(now.getDate() - 30);
    }

    return { start, end };
  }

  /**
   * Alle KPIs für einen Tenant berechnen
   */
  async getKpis(tenantId: string, range: KpiRange = '7d'): Promise<KpiResult> {
    const { start, end } = this.rangeToDates(range);

    // 1. Anzahl beantworteter Anfragen
    const answered = await this.getAnsweredCount(tenantId, start, end);

    // 2. Self-Service-Quote
    const selfServiceRate = await this.getSelfServiceRate(tenantId, start, end);

    // 3. Vollständig gelöst
    const fullySolved = await this.getFullySolvedCount(tenantId, start, end);

    // 4. & 5. Zeitersparnis und FTE-Ersparnis
    const { timeSavedHours, fteSaved } = await this.getTimeSaved(
      tenantId,
      start,
      end,
    );

    // 6. Außerhalb Öffnungszeiten
    const afterHoursPercent = await this.getAfterHoursPercent(
      tenantId,
      start,
      end,
    );

    // 7. Top-5 Themen
    const topTopics = await this.getTopTopics(tenantId, start, end, 5);

    // 8. Abdeckungsgrad
    const coverageRate = await this.getCoverageRate(tenantId, start, end);

    // Zusätzliche Metriken
    const p95LatencyMs = await this.getP95Latency(tenantId, start, end);
    const csat = await this.getCsat(tenantId, start, end);

    return {
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
  }

  /**
   * Validiere Tenant-ID (UUID-Format)
   */
  private validateTenantId(tenantId: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      throw new Error(`Invalid tenant ID format: ${tenantId}`);
    }
  }

  /**
   * 1. Anzahl beantworteter Anfragen
   */
  private async getAnsweredCount(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    this.validateTenantId(tenantId);
    const result = await this.prisma.client.$queryRaw<Array<{ answered: bigint }>>`
      SELECT count(*)::int AS answered 
      FROM "ConversationMessage" a 
      JOIN "Conversation" i ON i.id = a."conversationId"
      WHERE i."tenantId" = ${tenantId}::uuid
        AND a.role = 'assistant'
        AND a."createdAt" BETWEEN ${start} AND ${end}
    `;
    return Number(result?.[0]?.answered ?? 0);
  }

  /**
   * 2. Self-Service-Quote
   */
  private async getSelfServiceRate(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    this.validateTenantId(tenantId);
    const result = await this.prisma.client.$queryRaw<Array<{ rate: number }>>`
      SELECT coalesce(avg(CASE WHEN a.solved THEN 1 ELSE 0 END), 0) AS rate
      FROM "ConversationMessage" a 
      JOIN "Conversation" i ON i.id = a."conversationId"
      WHERE i."tenantId" = ${tenantId}::uuid
        AND a.role = 'assistant'
        AND a."createdAt" BETWEEN ${start} AND ${end}
    `;
    return Number(result?.[0]?.rate ?? 0);
  }

  /**
   * 3. Vollständig gelöst
   */
  private async getFullySolvedCount(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    this.validateTenantId(tenantId);
    const result = await this.prisma.client.$queryRaw<Array<{ solved: bigint }>>`
      SELECT count(*)::int AS solved
      FROM "ConversationMessage" a 
      JOIN "Conversation" i ON i.id = a."conversationId"
      WHERE i."tenantId" = ${tenantId}::uuid
        AND a.role = 'assistant'
        AND a.solved = true
        AND a."createdAt" BETWEEN ${start} AND ${end}
    `;
    return Number(result?.[0]?.solved ?? 0);
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

    interface TenantSettings {
      metrics?: {
        avgHandleTimeMin?: {
          default?: number;
        };
      };
    }

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
   */
  private async getAfterHoursPercent(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    this.validateTenantId(tenantId);
    // Hole officeHours aus Tenant-Settings (Standard: 8-18)
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    interface TenantSettings {
      officeHours?: {
        open?: number;
        close?: number;
      };
    }

    const settings = (tenant?.settings as TenantSettings) || {};
    const officeHours = settings.officeHours || { open: 8, close: 18 };
    const openHour = officeHours.open || 8;
    const closeHour = officeHours.close || 18;

    const result = await this.prisma.client.$queryRaw<Array<{ after_hours_pct: number }>>`
      WITH q AS (
        SELECT m.* 
        FROM "ConversationMessage" m 
        JOIN "Conversation" i ON i.id = m."conversationId"
        WHERE i."tenantId" = ${tenantId}::uuid
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

  /**
   * 7. Top-N Themen
   */
  private async getTopTopics(
    tenantId: string,
    start: Date,
    end: Date,
    limit: number = 5,
  ): Promise<Array<{ topic: string; count: number }>> {
    this.validateTenantId(tenantId);
    const result = await this.prisma.client.$queryRaw<Array<{ topic: string; count: bigint }>>`
      SELECT 
        payloadJsonb->>'topic' AS topic, 
        count(*)::int AS count
      FROM "Event"
      WHERE "tenantId" = ${tenantId}::uuid
        AND type = 'chat.asked' 
        AND payloadJsonb->>'topic' IS NOT NULL
        AND ts BETWEEN ${start} AND ${end}
      GROUP BY 1 
      ORDER BY count DESC 
      LIMIT ${limit}
    `;
    return result.map((r) => ({
      topic: r.topic || 'Unknown',
      count: Number(r.count),
    }));
  }

  /**
   * 8. Abdeckungsgrad (Anteil Top-N-Themen mit quality>=good)
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

    // Prüfe Quality für jedes Thema (Feedback >=4* oder solved=true)
    // Note: $queryRaw mit Template Literals unterstützt keine Arrays direkt
    // Wir verwenden hier $queryRawUnsafe mit validierten Parametern (tenantId ist validiert)
    const topicArray = `{${topicNames.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(',')}}`;
    const result = await this.prisma.client.$queryRawUnsafe<Array<{ good_count: bigint; total_count: bigint }>>(
      `WITH topic_events AS (
        SELECT 
          e.payloadJsonb->>'topic' AS topic,
          e.payloadJsonb->>'queryId' AS query_id
        FROM "Event" e
        WHERE e."tenantId" = $1::uuid
          AND e.type = 'chat.asked'
          AND e.payloadJsonb->>'topic' = ANY($2::text[])
          AND e.ts BETWEEN $3 AND $4
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
      ) q`,
      tenantId, // Validated via validateTenantId()
      topicArray, // Sanitized array string
      start,
      end,
    );

    const goodCount = Number(result?.[0]?.good_count ?? 0);
    const totalCount = Number(result?.[0]?.total_count ?? 0);

    return totalCount > 0 ? (goodCount / totalCount) * 100 : 0;
  }

  /**
   * P95 Latenz
   */
  private async getP95Latency(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    this.validateTenantId(tenantId);
    const result = await this.prisma.client.$queryRaw<Array<{ p95: number }>>`
      SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY a."latencyMs") AS p95
      FROM "ConversationMessage" a 
      JOIN "Conversation" i ON i.id = a."conversationId"
      WHERE i."tenantId" = ${tenantId}::uuid
        AND a.role = 'assistant'
        AND a."latencyMs" IS NOT NULL
        AND a."createdAt" BETWEEN ${start} AND ${end}
    `;
    return Number(result?.[0]?.p95 ?? 0);
  }

  /**
   * CSAT (Customer Satisfaction)
   */
  private async getCsat(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    this.validateTenantId(tenantId);
    const result = await this.prisma.client.$queryRaw<Array<{ csat: number }>>`
      SELECT round(avg(CASE
        WHEN type IN ('STAR5', 'UP') THEN 5
        WHEN type = 'STAR4' THEN 4
        WHEN type = 'STAR3' THEN 3
        WHEN type = 'STAR2' THEN 2
        WHEN type IN ('STAR1', 'DOWN') THEN 1
        ELSE NULL
      END)::numeric, 2) AS csat
      FROM "Feedback"
      WHERE "tenantId" = ${tenantId}::uuid
        AND type IS NOT NULL
        AND "createdAt" BETWEEN ${start} AND ${end}
    `;
    return Number(result?.[0]?.csat ?? 0);
  }
}
