import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { KeycloakService } from './keycloak.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { sanitizeText } from '@wattweiser/shared';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private _configService: ConfigService,
    private keycloakService: KeycloakService,
    private tokenBlacklistService: TokenBlacklistService
  ) {}

  async validateUser(username: string, password: string) {
    // Input-Sanitization: Entferne gefährliche Zeichen
    const sanitizedUsername = sanitizeText(username);
    const sanitizedPassword = sanitizeText(password);

    // Development-Mode: Mock-Login ohne Keycloak
    const isDevelopment = this._configService.get<string>('NODE_ENV') === 'development';
    const keycloakDisabled = this._configService.get<string>('DISABLE_KEYCLOAK', 'false') === 'true';
    
    if (isDevelopment && keycloakDisabled) {
      // Mock-Login für Development (jeder User/Pass funktioniert)
      return {
        id: 'dev-user-123',
        email: sanitizedUsername,
        keycloakId: 'dev-keycloak-123',
        token: 'dev-mock-token',
      };
    }

    // Keycloak validation
    try {
      const token = await this.keycloakService.login(sanitizedUsername, sanitizedPassword);
      const userInfo = await this.keycloakService.getUserInfo(token.access_token);

      return {
        id: userInfo.sub,
        email: userInfo.email,
        keycloakId: userInfo.sub,
        token: token.access_token,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      keycloakId: user.keycloakId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async validateToken(token: string) {
    try {
      // Prüfen ob Token in Blacklist ist
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      // Validate with Keycloak
      const userInfo = await this.keycloakService.getUserInfo(token);
      return {
        id: userInfo.sub,
        email: userInfo.email,
        keycloakId: userInfo.sub,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Token invalidieren (für Logout)
   */
  async logout(token: string, userId?: string): Promise<void> {
    await this.tokenBlacklistService.addToBlacklist(token, userId);
  }

  /**
   * Alle Tokens eines Users invalidieren
   */
  async logoutAll(userId: string): Promise<void> {
    await this.tokenBlacklistService.invalidateUserTokens(userId);
  }
}
