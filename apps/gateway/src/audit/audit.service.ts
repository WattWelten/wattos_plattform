import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@wattweiser/db';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {}

  async log(
    action: string,
    details: any,
    options?: {
      tenantId?: string;
      userId?: string;
      resourceType?: string;
      resourceId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    const auditEnabled = this.configService.get<boolean>('AUDIT_ENABLED', true);
    
    if (!auditEnabled) {
      return;
    }

    try {
      // In Datenbank speichern
      await this.prisma.auditLog.create({
        data: {
          tenantId: options?.tenantId || 'default',
          userId: options?.userId,
          action,
          resourceType: options?.resourceType,
          resourceId: options?.resourceId,
          details: details || {},
          ipAddress: options?.ipAddress,
          userAgent: options?.userAgent,
        },
      });
    } catch (error: any) {
      // Fallback: Console-Logging bei DB-Fehler
      this.logger.error(`Failed to write audit log to database: ${error.message}`);
      this.logger.debug('[AUDIT]', {
        action,
        details,
        timestamp: new Date().toISOString(),
        tenantId: options?.tenantId,
        userId: options?.userId,
      });
    }
  }
}


