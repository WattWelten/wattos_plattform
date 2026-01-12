/**
 * RBAC Guard für Role-basierte Zugriffskontrolle
 * 
 * Prüft ob User eine der erforderlichen Rollen hat:
 * - ADMIN: Vollzugriff
 * - EDITOR: Erstellen/Ändern/Publishen
 * - VIEWER: Lesen + Test Console
 * 
 * Verwendet RoleType enum aus Prisma Schema.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@wattweiser/db';

export enum RoleType {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Hole erforderliche Rollen aus Metadata
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Wenn keine Rollen erforderlich sind, erlaube Zugriff
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Prüfe ob User authentifiziert ist
    if (!user) {
      this.logger.warn('RBAC Guard: No user in request');
      throw new ForbiddenException('Authentication required');
    }

    // Hole Tenant-ID aus Request (von TenantMiddleware gesetzt)
    const tenantId = (request as any).tenantId || user.tenantId;
    if (!tenantId) {
      this.logger.warn('RBAC Guard: No tenantId in request');
      throw new ForbiddenException('Tenant context required');
    }

    // Hole User-Rollen für Tenant
    const userRoles = await this.getUserRoles(user.id, tenantId);

    // Prüfe ob User eine der erforderlichen Rollen hat
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      this.logger.warn(
        `RBAC Guard: User ${user.id} does not have required roles. ` +
        `Required: ${requiredRoles.join(', ')}, Has: ${userRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Hole Rollen eines Users für einen Tenant
   */
  private async getUserRoles(
    userId: string,
    tenantId: string,
  ): Promise<RoleType[]> {
    try {
      const userRoles = await this.prisma.client.userRole.findMany({
        where: {
          userId,
          role: {
            tenantId,
          },
        },
        include: {
          role: {
            select: {
              roleType: true,
            },
          },
        },
      });

      // Extrahiere RoleType enum Werte
      const roles = userRoles
        .map((ur) => ur.role.roleType)
        .filter((rt): rt is RoleType => rt !== null);

      // Fallback: Wenn keine RoleType gesetzt ist, prüfe Role.name
      if (roles.length === 0) {
        const rolesByName = await this.prisma.client.userRole.findMany({
          where: {
            userId,
            role: {
              tenantId,
            },
          },
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        });

        // Mappe Role.name zu RoleType (Fallback für Migration)
        return rolesByName.map((ur) => {
          const name = ur.role.name.toUpperCase();
          if (name.includes('ADMIN')) return RoleType.ADMIN;
          if (name.includes('EDITOR')) return RoleType.EDITOR;
          if (name.includes('VIEWER')) return RoleType.VIEWER;
          return null;
        }).filter((rt): rt is RoleType => rt !== null);
      }

      return roles;
    } catch (error) {
      this.logger.error(`Failed to get user roles: ${error}`);
      return [];
    }
  }
}
