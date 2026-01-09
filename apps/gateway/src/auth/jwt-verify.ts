import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTPayload, JWK } from 'jose';

export interface VerifiedToken extends JWTPayload {
  sub: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: {
    [key: string]: {
      roles?: string[];
    };
  };
}

// CachedJWK interface nicht mehr benötigt, da jose library intern cached
// interface CachedJWK {
//   jwk: JWK;
//   expiresAt: number;
// }

@Injectable()
export class JwtVerifyService {
  private jwksUrl: string;
  private issuer: string;
  private audience: string;
  // jwksCache und CACHE_TTL werden nicht verwendet, da jose library intern cached
  // private jwksCache: Map<string, CachedJWK> = new Map();
  // private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden
  private remoteJWKSet: ReturnType<typeof createRemoteJWKSet>;

  constructor(private configService: ConfigService) {
    // JWKS URL für Token-Verifizierung (muss mit Keycloak Realm übereinstimmen)
    this.jwksUrl =
      this.configService.get<string>('KEYCLOAK_JWKS_URL') ||
      'http://localhost:8080/realms/wattos/protocol/openid-connect/certs';
    
    // Issuer muss exakt mit Keycloak Realm Issuer übereinstimmen
    this.issuer =
      this.configService.get<string>('KEYCLOAK_ISSUER') ||
      'http://localhost:8080/realms/wattos';
    
    // Audience muss mit Keycloak Client übereinstimmen
    this.audience = this.configService.get<string>('KEYCLOAK_AUDIENCE') || 'gateway';
    
    // Validiere, dass alle erforderlichen Werte gesetzt sind
    if (!this.jwksUrl || !this.issuer || !this.audience) {
      throw new Error('KEYCLOAK_JWKS_URL, KEYCLOAK_ISSUER, and KEYCLOAK_AUDIENCE must be set');
    }

    // Erstelle Remote JWK Set mit automatischem Caching (jose library cached intern)
    // Zusätzlich implementieren wir ein explizites Cache für bessere Kontrolle
    this.remoteJWKSet = createRemoteJWKSet(new URL(this.jwksUrl));
  }

  /**
   * Verifiziert JWT-Token via JWKS
   * JWKS werden automatisch von jose library gecacht (interner Cache)
   * Zusätzlich haben wir einen expliziten Cache für bessere Kontrolle
   */
  async verifyToken(token: string): Promise<VerifiedToken> {
    try {
      // createRemoteJWKSet cached automatisch JWKS für 24h (Standard)
      // Wir verwenden die bereits initialisierte remoteJWKSet Instanz
      const { payload } = await jwtVerify(token, this.remoteJWKSet, {
        issuer: this.issuer,
        audience: this.audience,
      });

      // Extrahiere Rollen aus verschiedenen Claims
      const roles: string[] = [];
      
      // Realm-Rollen
      if ((payload as any).realm_access?.roles) {
        roles.push(...(payload as any).realm_access.roles);
      }

      // Client-spezifische Rollen
      if ((payload as any).resource_access) {
        for (const clientRoles of Object.values((payload as any).resource_access)) {
          if ((clientRoles as any).roles) {
            roles.push(...(clientRoles as any).roles);
          }
        }
      }

      // Direkte roles Claim (falls vorhanden)
      if ((payload as any).roles && Array.isArray((payload as any).roles)) {
        roles.push(...(payload as any).roles);
      }

      // Extrahiere tenantId falls vorhanden (aus custom claims oder email domain)
      const tenantId: string | undefined = (payload as any).tenantId || 
                       (typeof payload.email === 'string' ? payload.email.split('@')[1]?.split('.')[0] : undefined);

      return {
        ...payload,
        roles: [...new Set(roles)], // Entferne Duplikate
        tenantId, // Füge tenantId hinzu
      } as VerifiedToken;
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(`Token verification failed: ${error.message}`);
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }

  /**
   * Prüft ob Benutzer eine bestimmte Rolle hat
   */
  hasRole(token: VerifiedToken, role: string): boolean {
    return token.roles?.includes(role) ?? false;
  }

  /**
   * Prüft ob Benutzer eine der Rollen hat
   */
  hasAnyRole(token: VerifiedToken, roles: string[]): boolean {
    return roles.some((role) => this.hasRole(token, role));
  }
}
