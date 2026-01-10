/**
 * Events SDK für Multi-Tenant KPI Tracking
 * 
 * Einheitliches Event-Tracking für Analytics und KPI-Berechnungen.
 * Alle Events sind tenant-aware und werden in der Event-Tabelle gespeichert.
 */

import type { PrismaClient } from '@prisma/client';

/**
 * Event-Typen für KPI-Tracking
 */
export type EventType =
  | 'ingestion.started'
  | 'ingestion.completed'
  | 'chat.asked'
  | 'chat.answered'
  | 'feedback.given';

/**
 * Event-Payload-Typen (optional, für Type-Safety)
 */
export interface IngestionStartedPayload {
  sourceId?: string;
  sourceType?: string;
  spaceId?: string;
}

export interface IngestionCompletedPayload {
  sourceId?: string;
  sourceType?: string;
  spaceId?: string;
  documentsCount?: number;
  chunksCount?: number;
  durationMs?: number;
}

export interface ChatAskedPayload {
  question: string;
  channel?: string;
  conversationId?: string;
  sessionId?: string;
  lang?: string;
}

export interface ChatAnsweredPayload {
  conversationId?: string;
  queryId?: string;
  latencyMs?: number;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  costCents?: number;
  solved?: boolean;
}

export interface FeedbackGivenPayload {
  queryId?: string;
  type: 'UP' | 'DOWN' | 'STAR1' | 'STAR2' | 'STAR3' | 'STAR4' | 'STAR5';
  reason?: string;
}

/**
 * Track ein Event in der Datenbank
 * 
 * @param db Prisma Client
 * @param tenantId Tenant-ID
 * @param type Event-Typ
 * @param payload Event-Payload (wird als JSON gespeichert)
 */
export async function track(
  db: PrismaClient,
  tenantId: string,
  type: EventType,
  payload: any,
): Promise<void> {
  try {
    await db.event.create({
      data: {
        tenantId,
        type,
        payloadJsonb: payload, // Verwende payloadJsonb (bestehendes Feld)
        ts: new Date(),
      },
    });
  } catch (error) {
    // Log error but don't throw (Event-Tracking sollte nicht kritisch sein)
    console.error(`Failed to track event ${type} for tenant ${tenantId}:`, error);
  }
}

/**
 * Batch-Tracking für mehrere Events
 * 
 * @param db Prisma Client
 * @param events Array von Events
 */
export async function trackBatch(
  db: PrismaClient,
  events: Array<{ tenantId: string; type: EventType; payload: any }>,
): Promise<void> {
  try {
    await db.event.createMany({
      data: events.map((e) => ({
        tenantId: e.tenantId,
        type: e.type,
        payloadJsonb: e.payload,
        ts: new Date(),
      })),
    });
  } catch (error) {
    console.error('Failed to track batch events:', error);
  }
}
