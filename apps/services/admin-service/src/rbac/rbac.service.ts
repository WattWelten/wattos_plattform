import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { CreateRoleDto, UpdateRoleDto } from './dto/rbac.dto';

/**
 * RBAC Service
 * Verwaltet Rollen, Berechtigungen und Zuweisungen
 */
@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Rolle erstellen
   */
  async createRole(tenantId: string, dto: CreateRoleDto) {
    const role = await this.prismaService.client.role.create({
      data: {
        tenantId,
        name: dto.name,
        permissions: dto.permissions || [],
      },
    });

    this.logger.log(`Role created: ${role.id} (${role.name})`);
    return role;
  }

  /**
   * Rolle aktualisieren
   */
  async updateRole(roleId: string, dto: UpdateRoleDto) {
    const role = await this.prismaService.client.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    const updated = await this.prismaService.client.role.update({
      where: { id: roleId },
      data: {
        name: dto.name,
        permissions: dto.permissions,
      },
    });

    this.logger.log(`Role updated: ${roleId}`);
    return updated;
  }

  /**
   * Rolle löschen
   */
  async deleteRole(roleId: string) {
    const role = await this.prismaService.client.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    await this.prismaService.client.role.delete({
      where: { id: roleId },
    });

    this.logger.log(`Role deleted: ${roleId}`);
    return { success: true };
  }

  /**
   * Rollen auflisten
   */
  async listRoles(tenantId: string) {
    return this.prismaService.client.role.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Rolle abrufen
   */
  async getRole(roleId: string) {
    const role = await this.prismaService.client.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    return role;
  }

  /**
   * Rolle zuweisen
   */
  async assignRole(userId: string, roleId: string) {
    // Prüfen ob Rolle existiert
    const role = await this.prismaService.client.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    // Prüfen ob User existiert
    const user = await this.prismaService.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // User-Role-Zuweisung in DB speichern
    await this.prismaService.client.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      create: {
        userId,
        roleId,
      },
      update: {},
    });

    this.logger.log(`Role ${roleId} assigned to user ${userId}`);
    return { success: true };
  }

  /**
   * Berechtigungen prüfen
   */
  async checkPermission(userId: string, permission: string): Promise<boolean> {
    const user = await this.prismaService.client.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Alle Rollen des Users durchgehen und Berechtigungen prüfen
    for (const userRole of user.userRoles) {
      const role = userRole.role;
      const permissions = role.permissions as string[];
      
      if (permissions.includes(permission) || permissions.includes('*')) {
        return true;
      }
    }

    return false;
  }

  /**
   * User-Rollen abrufen
   */
  async getUserRoles(userId: string) {
    const user = await this.prismaService.client.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return user.userRoles.map((ur: any) => ur.role);
  }
}


