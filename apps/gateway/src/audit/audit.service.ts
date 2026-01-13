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
      // Prüfe ob Prisma Client verfügbar ist
      if (!this.prisma || !this.prisma.client) {
        this.logger.warn('PrismaService not available, skipping audit log');
        return;
      }

      // In Datenbank speichern (verwende client mit Type Assertion, da Prisma-Typen zur Compile-Zeit nicht verfügbar sind)
      await (this.prisma.client as any).auditLog.create({
        data: {
          tenantId: options?.tenantId || 'default',
          userId: options?.userId,
          action,
          resourceType: options?.resourceType,
          resourceId: options?.resourceId,
          details: details || {},
          metadata: {}, // Zusätzliche Metadaten für Logs (leer, kann später erweitert werden)
          ipAddress: options?.ipAddress,
          userAgent: options?.userAgent,
        },
      });
    } catch (error: unknown) {
      // Fallback: Console-Logging bei DB-Fehler
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to write audit log to database: ${errorMessage}`);
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
