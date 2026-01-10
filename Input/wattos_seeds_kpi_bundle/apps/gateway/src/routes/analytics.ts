import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { getKpis } from '../../../packages/core/analytics/kpi';
export function createAnalyticsRouter(db: PrismaClient) {
  const r = Router();
  r.get('/kpi', async (req, res) => {
    const range = (req.query.range as any) || '7d'; const tenantId = (req as any).tenantId || 'default';
    try { const data = await getKpis(db, tenantId, range); res.json({ tenantId, range, ...data }); }
    catch (e:any) { res.status(500).json({ error: e?.message || 'kpi_error' }); }
  }); return r;
}
