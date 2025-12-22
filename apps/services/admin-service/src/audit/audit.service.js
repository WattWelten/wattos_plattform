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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@wattweiser/db");
let AuditService = AuditService_1 = class AuditService {
    logger = new common_1.Logger(AuditService_1.name);
    prisma;
    constructor() {
        this.prisma = new db_1.PrismaClient();
    }
    async getAuditLogs(query) {
        const where = {};
        if (query.tenantId) {
            where.tenantId = query.tenantId;
        }
        if (query.userId) {
            where.userId = query.userId;
        }
        if (query.action) {
            where.action = query.action;
        }
        if (query.resourceType) {
            where.resourceType = query.resourceType;
        }
        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate) {
                where.createdAt.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.createdAt.lte = new Date(query.endDate);
            }
        }
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: query.limit || 100,
                skip: query.offset || 0,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            logs,
            total,
            limit: query.limit || 100,
            offset: query.offset || 0,
        };
    }
    async getAuditLog(logId) {
        return this.prisma.auditLog.findUnique({
            where: { id: logId },
        });
    }
    async getAuditStats(tenantId, startDate, endDate) {
        const where = { tenantId };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = startDate;
            }
            if (endDate) {
                where.createdAt.lte = endDate;
            }
        }
        const [totalLogs, actionsByType, topUsers] = await Promise.all([
            this.prisma.auditLog.count({ where }),
            this.prisma.auditLog.groupBy({
                by: ['action'],
                where,
                _count: true,
            }),
            this.prisma.auditLog.groupBy({
                by: ['userId'],
                where: { ...where, userId: { not: null } },
                _count: true,
                orderBy: { _count: { userId: 'desc' } },
                take: 10,
            }),
        ]);
        return {
            totalLogs,
            actionsByType: actionsByType.map((item) => ({
                action: item.action,
                count: item._count,
            })),
            topUsers: topUsers.map((item) => ({
                userId: item.userId,
                count: item._count,
            })),
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AuditService);
//# sourceMappingURL=audit.service.js.map