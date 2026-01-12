/**
 * JWT Auth Guard für Dashboard-Service
 * 
 * Prüft ob Request authentifiziert ist.
 * 
 * Wenn Service über Gateway geroutet wird:
 * - Gateway verifiziert JWT-Token via JWKS
 * - Gateway setzt req.user und req.tenantId
 * - Dieser Guard prüft nur ob req.user vorhanden ist
 * 
 * Wenn Service direkt aufgerufen wird (nur für Entwicklung):
 * - Prüft X-User-Id Header (vom Gateway gesetzt)
 * - Erstellt minimales req.user Objekt
 */

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // 1. Prüfe ob req.user bereits gesetzt ist (vom Gateway)
    if (request.user) {
      return true;
    }

    // 2. Fallback: Prüfe X-User-Id Header (vom Gateway beim Proxying gesetzt)
    const userId = request.header('x-user-id');
    if (userId) {
      // Erstelle minimales user Objekt für direkte Service-Calls
      request.user = {
        id: userId,
        email: request.header('x-user-email') || undefined,
        tenantId: request.header('x-tenant-id') || undefined,
      };
      this.logger.debug(`User resolved from headers: ${userId}`);
      return true;
    }

    // Keine Authentifizierung gefunden
    this.logger.warn('JWT Auth Guard: No user in request and no X-User-Id header');
    throw new UnauthorizedException('Authentication required. Please access via Gateway or provide X-User-Id header.');
  }
}
