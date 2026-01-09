import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

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

@Injectable()
export class JwtVerifyService {
  private jwksUrl: string;
  private issuer: string;
  private audience: string;

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
  }

  /**
   * Verifiziert JWT-Token via JWKS
   */
  async verifyToken(token: string): Promise<VerifiedToken> {
    try {
      const JWKS = createRemoteJWKSet(new URL(this.jwksUrl));

      const { payload } = await jwtVerify(token, JWKS, {
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
