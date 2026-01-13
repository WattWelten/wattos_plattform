import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { KeycloakService } from './keycloak.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { sanitizeText } from '@wattweiser/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
      this.logger.debug(`Attempting Keycloak login for user: ${sanitizedUsername}`);
      const token = await this.keycloakService.login(sanitizedUsername, sanitizedPassword);
      this.logger.debug('Keycloak login successful, fetching user info...');
      const userInfo = await this.keycloakService.getUserInfo(token.access_token);

      return {
        id: userInfo.sub,
        email: userInfo.email,
        keycloakId: userInfo.sub,
        token: token.access_token,
      };
    } catch (error) {
      this.logger.error('Keycloak authentication failed:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response) {
          this.logger.error(`Keycloak error response: ${JSON.stringify(axiosError.response.data)}`);
          this.logger.error(`Keycloak status: ${axiosError.response.status}`);
        }
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      keycloakId: user.keycloakId,
    };

    // Hole JWT Expiration Time (Standard: 1h = 3600s)
    const expiresIn = this.parseJwtExpiry(
      this._configService.get<string>('JWT_EXPIRES_IN', '1h')
    );

    return {
      access_token: this.jwtService.sign(payload),
      expires_in: expiresIn,
      token_type: 'Bearer',
      user,
    };
  }

  async register(name: string, email: string, password: string, tenantType: string) {
    // Input-Sanitization: Entferne gefährliche Zeichen
    const sanitizedName = sanitizeText(name);
    const sanitizedEmail = sanitizeText(email);
    sanitizeText(password); // Sanitize für Sicherheit, wird aber nicht verwendet (wird an Keycloak übergeben)

    // Development-Mode: Mock-Register ohne Keycloak
    const isDevelopment = this._configService.get<string>('NODE_ENV') === 'development';
    const keycloakDisabled = this._configService.get<string>('DISABLE_KEYCLOAK', 'false') === 'true';
    
    if (isDevelopment && keycloakDisabled) {
      // Mock-Register für Development
      const mockUser = {
        id: `dev-user-${Date.now()}`,
        email: sanitizedEmail,
        name: sanitizedName,
        keycloakId: `dev-keycloak-${Date.now()}`,
        tenantType,
        token: 'dev-mock-token',
      };
      
      this.logger.debug(`Mock registration for user: ${sanitizedEmail}`);
      return this.login(mockUser);
    }

    // Keycloak registration (falls Keycloak aktiviert ist)
    try {
      this.logger.debug(`Attempting Keycloak registration for user: ${sanitizedEmail}`);
      // TODO: Implementiere Keycloak User Registration
      // Für jetzt: Wirft einen Fehler, da Keycloak-Registration noch nicht implementiert ist
      throw new Error('Keycloak registration not yet implemented. Use development mode with DISABLE_KEYCLOAK=true');
    } catch (error) {
      this.logger.error('Registration failed:', error instanceof Error ? error.message : String(error));
      throw new UnauthorizedException('Registration failed');
    }
  }

  /**
   * Parst JWT Expiration String (z.B. "1h", "3600s") zu Sekunden
   */
  private parseJwtExpiry(expiry: string): number {
    if (!expiry) return 3600; // Default: 1 Stunde

    const match = expiry.match(/^(\d+)([smhd])?$/i);
    if (!match || !match[1]) return 3600; // Fix: Prüfe match[1]

    const value = parseInt(match[1], 10);
    const unit = (match[2] || 's').toLowerCase();

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
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
