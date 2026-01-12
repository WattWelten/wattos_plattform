/**
 * Tenant-Resolver Middleware für Dashboard-Service
 * 
 * Extrahiert Tenant-ID aus:
 * 1. X-Tenant-Id Header (vom Gateway gesetzt)
 * 2. req.tenantId (falls bereits gesetzt)
 * 3. Fallback: user.tenantId
 * 
 * Setzt req.tenantId für nachfolgende Middleware/Guards
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(req: Request, _res: Response, next: NextFunction) {
    // 1. Prüfe ob req.tenantId bereits gesetzt ist (vom Gateway)
    if ((req as any).tenantId) {
      this.logger.debug(`Tenant already set: ${(req as any).tenantId}`);
      return next();
    }

    // 2. Prüfe X-Tenant-Id Header (vom Gateway gesetzt beim Proxying)
    const headerTenantId = req.header('x-tenant-id');
    if (headerTenantId) {
      (req as any).tenantId = headerTenantId;
      this.logger.debug(`Tenant resolved from header: ${headerTenantId}`);
      return next();
    }

    // 3. Fallback: Prüfe user.tenantId (falls vorhanden)
    const userTenantId = (req as any).user?.tenantId;
    if (userTenantId) {
      (req as any).tenantId = userTenantId;
      this.logger.debug(`Tenant resolved from user: ${userTenantId}`);
      return next();
    }

    // 4. Fallback: Default-Tenant (nur für Entwicklung)
    const defaultTenant = process.env.DEFAULT_TENANT_ID;
    if (defaultTenant) {
      (req as any).tenantId = defaultTenant;
      this.logger.debug(`Tenant resolved from DEFAULT_TENANT_ID: ${defaultTenant}`);
      return next();
    }

    // Kein Tenant gefunden - wird vom Controller als BadRequest behandelt
    this.logger.warn(
      `No tenant ID found in request. Headers: ${JSON.stringify(req.headers)}`,
    );
    next();
  }
}
