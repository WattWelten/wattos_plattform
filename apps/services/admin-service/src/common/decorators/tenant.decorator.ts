import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Tenant Decorator
 * Extrahiert Tenant-ID aus Request-Header (X-Tenant-Id) oder User-Objekt
 */
export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    
    // 1. Aus Header extrahieren
    const tenantIdFromHeader = request.headers['x-tenant-id'];
    if (tenantIdFromHeader) {
      return tenantIdFromHeader;
    }
    
    // 2. Aus User-Objekt (wenn vorhanden)
    const user = request.user;
    if (user?.tenantId) {
      return user.tenantId;
    }
    
    // 3. Fallback: Default-Tenant (nur für Entwicklung)
    return process.env.DEFAULT_TENANT_ID || 'default-tenant';
  },
);











