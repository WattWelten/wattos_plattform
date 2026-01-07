import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenBlacklistService } from '../token-blacklist.service';

/**
 * Token Blacklist Guard
 * Prüft ob das Token in der Blacklist ist, bevor die JWT-Strategy validiert
 */
@Injectable()
export class TokenBlacklistGuard implements CanActivate {
  constructor(private tokenBlacklistService: TokenBlacklistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (!authHeader) {
      return true; // Lassen Sie JWT Guard den Fehler behandeln
    }

    const token = authHeader.replace('Bearer ', '');

    if (token) {
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been invalidated');
      }
    }

    return true;
  }
}
