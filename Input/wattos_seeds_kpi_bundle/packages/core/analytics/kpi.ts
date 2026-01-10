import type { PrismaClient } from '@prisma/client';
export type KpiRange = 'today' | '7d' | '30d';
function rangeToDates(r: KpiRange) {
  const now = new Date(); const end = now; const start = new Date();
  if (r==='today') start.setHours(0,0,0,0);
  else if (r==='7d') start.setDate(now.getDate()-7);
  else if (r==='30d') start.setDate(now.getDate()-30);
  return { start, end };
}
export async function getKpis(db: PrismaClient, tenantId: string, range: KpiRange) {
  const { start, end } = rangeToDates(range);
  const answered = await db.$queryRawUnsafe<any[]>(
    `SELECT count(*)::int AS answered FROM "Answer" a JOIN "Interaction" i ON i.id=a."interactionId"
     WHERE i."tenantId"=$1 AND a."createdAt" BETWEEN $2 AND $3`, tenantId, start, end);
  const selfService = await db.$queryRawUnsafe<any[]>(
    `SELECT coalesce(avg(CASE WHEN a.solved THEN 1 ELSE 0 END),0) AS rate FROM "Answer" a JOIN "Interaction" i ON i.id=a."interactionId"
     WHERE i."tenantId"=$1 AND a."createdAt" BETWEEN $2 AND $3`, tenantId, start, end);
  const p95 = await db.$queryRawUnsafe<any[]>(
    `SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY a."latencyMs") AS p95 FROM "Answer" a JOIN "Interaction" i ON i.id=a."interactionId"
     WHERE i."tenantId"=$1 AND a."createdAt" BETWEEN $2 AND $3`, tenantId, start, end);
  const csat = await db.$queryRawUnsafe<any[]>(
    `SELECT round(avg(CASE WHEN f.type IN ('STAR5','UP') THEN 5 WHEN f.type='STAR4' THEN 4 WHEN f.type='STAR3' THEN 3 WHEN f.type='STAR2' THEN 2 WHEN f.type IN ('STAR1','DOWN') THEN 1 END)::numeric,2) AS csat
     FROM "Feedback" f WHERE f."tenantId"=$1 AND f."createdAt" BETWEEN $2 AND $3`, tenantId, start, end);
  return { answered: Number(answered?.[0]?.answered ?? 0), selfServiceRate: Number(selfService?.[0]?.rate ?? 0),
           p95LatencyMs: Number(p95?.[0]?.p95 ?? 0), csat: Number(csat?.[0]?.csat ?? 0) };
}
