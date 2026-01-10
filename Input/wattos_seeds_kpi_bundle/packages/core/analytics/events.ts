import type { PrismaClient } from '@prisma/client';
export type EventType =
  | 'ingestion.started' | 'ingestion.completed'
  | 'chat.asked' | 'chat.answered'
  | 'feedback.given';
export async function track(db: PrismaClient, tenantId: string, type: EventType, payload: any) {
  await db.event.create({ data: { tenantId, type, payload } });
}
