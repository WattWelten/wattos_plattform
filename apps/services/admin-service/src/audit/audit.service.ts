import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { AuditLogQueryDto } from './dto/audit.dto';

/**
 * Audit Service
 * Verwaltet Audit-Logs und bietet Abfrage-Funktionen
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Audit-Logs abrufen
   */
  async getAuditLogs(query: AuditLogQueryDto) {
    const where: any = {};

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

  /**
   * Audit-Log abrufen
   */
  async getAuditLog(logId: string) {
    return this.prisma.auditLog.findUnique({
      where: { id: logId },
    });
  }

  /**
   * Audit-Statistiken
   */
  async getAuditStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };

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
}


