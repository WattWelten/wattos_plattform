import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

export interface VerifiedToken extends JWTPayload {
  sub: string;
  email?: string;
  roles?: string[];
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
    this.jwksUrl =
      this.configService.get<string>('KEYCLOAK_JWKS_URL') ||
      'http://localhost:8080/realms/wattos/protocol/openid-connect/certs';
    this.issuer =
      this.configService.get<string>('KEYCLOAK_ISSUER') ||
      'http://localhost:8080/realms/wattos';
    this.audience = this.configService.get<string>('KEYCLOAK_AUDIENCE') || 'gateway';
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
      if (payload.realm_access?.roles) {
        roles.push(...payload.realm_access.roles);
      }

      // Client-spezifische Rollen
      if (payload.resource_access) {
        for (const clientRoles of Object.values(payload.resource_access)) {
          if (clientRoles.roles) {
            roles.push(...clientRoles.roles);
          }
        }
      }

      // Direkte roles Claim (falls vorhanden)
      if (payload.roles && Array.isArray(payload.roles)) {
        roles.push(...payload.roles);
      }

      return {
        ...payload,
        roles: [...new Set(roles)], // Entferne Duplikate
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
