import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtVerifyService } from './jwt-verify';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtVerifyService: JwtVerifyService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Skip auth für Health-Checks und öffentliche Endpoints
    if (
      req.path.startsWith('/api/health') ||
      req.path.startsWith('/api/docs') ||
      req.path.startsWith('/api/auth/login') ||
      req.path.startsWith('/api/auth/register')
    ) {
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
