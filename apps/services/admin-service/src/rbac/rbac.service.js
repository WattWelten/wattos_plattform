"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RbacService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@wattweiser/db");
let RbacService = RbacService_1 = class RbacService {
    logger = new common_1.Logger(RbacService_1.name);
    prisma;
    constructor() {
        this.prisma = new db_1.PrismaClient();
    }
    async createRole(tenantId, dto) {
        const role = await this.prisma.role.create({
            data: {
                tenantId,
                name: dto.name,
                permissions: dto.permissions || [],
            },
        });
        this.logger.log(`Role created: ${role.id} (${role.name})`);
        return role;
    }
    async updateRole(roleId, dto) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role ${roleId} not found`);
        }
        const updated = await this.prisma.role.update({
            where: { id: roleId },
            data: {
                name: dto.name,
                permissions: dto.permissions,
            },
        });
        this.logger.log(`Role updated: ${roleId}`);
        return updated;
    }
    async deleteRole(roleId) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role ${roleId} not found`);
        }
        await this.prisma.role.delete({
            where: { id: roleId },
        });
        this.logger.log(`Role deleted: ${roleId}`);
        return { success: true };
    }
    async listRoles(tenantId) {
        return this.prisma.role.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getRole(roleId) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role ${roleId} not found`);
        }
        return role;
    }
    async assignRole(userId, roleId) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role ${roleId} not found`);
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User ${userId} not found`);
        }
        await this.prisma.userRole.upsert({
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
    async checkPermission(userId, permission) {
        const user = await this.prisma.user.findUnique({
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
        for (const userRole of user.userRoles) {
            const role = userRole.role;
            const permissions = role.permissions;
            if (permissions.includes(permission) || permissions.includes('*')) {
                return true;
            }
        }
        return false;
    }
    async getUserRoles(userId) {
        const user = await this.prisma.user.findUnique({
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
            throw new common_1.NotFoundException(`User ${userId} not found`);
        }
        return user.userRoles.map((ur) => ur.role);
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = RbacService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RbacService);
//# sourceMappingURL=rbac.service.js.map