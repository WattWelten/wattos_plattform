/**
 * Tenant-Resolver Middleware
 * 
 * Löst Tenant-ID aus:
 * 1. X-Tenant-Id Header (für API-Calls)
 * 2. Subdomain (z.B. {tenant}.wattweiser.com)
 * 3. Fallback: 'default'
 * 
 * Setzt req.tenantId für nachfolgende Middleware/Guards
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(req: Request, _res: Response, next: NextFunction) {
    // 1. Prüfe X-Tenant-Id Header (höchste Priorität)
    const headerTenantId = req.header('x-tenant-id');
    if (headerTenantId) {
      (req as any).tenantId = headerTenantId;
      this.logger.debug(`Tenant resolved from header: ${headerTenantId}`);
      return next();
    }

    // 2. Prüfe Subdomain (z.B. musterlandkreis.wattweiser.com)
    const hostname = req.hostname || '';
    const parts = hostname.split('.');
    
    // Bei mehreren Teilen: erster Teil ist Subdomain
    // Beispiel: musterlandkreis.wattweiser.com -> musterlandkreis
    // Beispiel: api.wattweiser.com -> api (wird ignoriert)
    let subdomain: string | null = null;
    
    if (parts.length > 2) {
      subdomain = parts[0]!;
      // Ignoriere 'api' Subdomain
      if (subdomain === 'api' && parts.length > 3) {
        subdomain = parts[1]!;
      } else if (subdomain === 'api') {
        subdomain = null;
      }
    }

    if (subdomain) {
      (req as any).tenantId = subdomain;
      this.logger.debug(`Tenant resolved from subdomain: ${subdomain}`);
      return next();
    }

    // 3. Fallback: Default-Tenant (nur für Entwicklung)
    const defaultTenant = process.env.DEFAULT_TENANT_ID || 'default';
    (req as any).tenantId = defaultTenant;
    
    if (defaultTenant !== 'default') {
      this.logger.debug(`Tenant resolved from DEFAULT_TENANT_ID: ${defaultTenant}`);
    } else {
      this.logger.warn(
        `No tenant ID found in header or subdomain, using default. ` +
        `Hostname: ${hostname}, Headers: ${JSON.stringify(req.headers)}`,
      );
    }

    next();
  }
}
