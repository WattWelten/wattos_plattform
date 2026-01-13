import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtVerifyService } from './jwt-verify';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private jwtVerifyService: JwtVerifyService,
    private configService: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Skip auth für OPTIONS-Requests (CORS Preflight)
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Skip auth für Health-Checks und öffentliche Endpoints
    if (
      req.path.startsWith('/api/health') ||
      req.path.startsWith('/api/docs') ||
      req.path.startsWith('/api/auth/login') ||
      req.path.startsWith('/api/auth/register')
    ) {
      return next();
    }

    // MVP-Mode: Wenn DISABLE_AUTH=true, überspringe Auth-Check und setze Mock-User
    const disableAuth = this.configService.get<string>('DISABLE_AUTH', 'false') === 'true';
    if (disableAuth) {
      // Setze Mock-User für MVP-Mode
      req.user = {
        id: 'mvp-user',
        email: 'mvp@wattweiser.com',
        roles: ['ADMIN'],
        keycloakId: 'mvp-keycloak-id',
        tenantId: 'default',
      };
      return next();
    }

    // Extrahiere Token aus Authorization Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      // Verifiziere Token via JWKS
      const verifiedToken = await this.jwtVerifyService.verifyToken(token);

      // Füge Benutzer-Informationen zum Request hinzu
      const user: Express.User = {
        id: verifiedToken.sub,
        roles: verifiedToken.roles || [],
        keycloakId: verifiedToken.sub,
      };
      if (verifiedToken.email) {
        user.email = verifiedToken.email;
      }
      req.user = user;

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }
}

// Erweitere Express Request Type
declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      roles: string[];
      keycloakId: string;
      tenantId?: string;
    }

    interface Request {
      user?: User;
    }
  }
}
