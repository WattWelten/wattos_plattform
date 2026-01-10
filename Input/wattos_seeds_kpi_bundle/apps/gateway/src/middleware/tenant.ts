import type { Request, Response, NextFunction } from 'express';
export function resolveTenant(req: Request, _res: Response, next: NextFunction) {
  const hdr = req.header('x-tenant-id');
  const host = req.hostname || ''; const parts = host.split('.');
  let sub = parts.length > 2 ? parts[0] : null; if (sub === 'api') sub = parts.length > 3 ? parts[1] : null;
  (req as any).tenantId = hdr || sub || 'default'; next();
}
