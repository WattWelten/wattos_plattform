import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Conditional Auth Guard für MVP-Mode
 * Wenn DISABLE_AUTH=true, wird Auth übersprungen und Mock-User gesetzt
 * Ansonsten wird JwtAuthGuard verwendet
 */
@Injectable()
export class ConditionalAuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private jwtAuthGuard: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const disableAuth = this.configService.get<string>('DISABLE_AUTH', 'false') === 'true';
    
    if (disableAuth) {
      // MVP-Mode: Setze Mock-User und erlaube Zugriff
      const request = context.switchToHttp().getRequest();
      request.user = {
        id: 'mvp-user',
        email: 'mvp@wattweiser.com',
        roles: ['ADMIN'],
        keycloakId: 'mvp-keycloak-id',
        tenantId: 'default',
      };
      return true;
    }

    // Normal-Mode: Verwende JWT Auth Guard
    return this.jwtAuthGuard.canActivate(context);
  }
}
