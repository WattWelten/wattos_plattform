import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { ProfileService } from '../profiles/profile.service';
import { EventBusService } from '../events/bus.service';
import { EventDomain, ComplianceEventSchema } from '../events/types';
import { v4 as uuid } from 'uuid';

/**
 * Retention Policy Service
 * 
 * Verwaltet Datenaufbewahrungsrichtlinien basierend auf Tenant-Profiles
 */
@Injectable()
export class RetentionPolicyService {
  private readonly logger = new Logger(RetentionPolicyService.name);
  private readonly prisma: PrismaClient;

  constructor(
    private readonly profileService: ProfileService,
    private readonly eventBus: EventBusService,
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Retention-Policy für Tenant abrufen
   */
  async getRetentionDays(tenantId: string): Promise<number> {
    try {
      const profile = await this.profileService.getProfile(tenantId);
      return profile.compliance?.retentionDays || 90; // Standard: 90 Tage
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to get retention policy for tenant ${tenantId}: ${errorMessage}`);
      return 90; // Fallback: 90 Tage
    }
  }

  /**
   * Alte Daten löschen (basierend auf Retention-Policy)
   */
  async cleanupExpiredData(tenantId: string): Promise<{
    deletedConversations: number;
    deletedMessages: number;
    deletedAuditLogs: number;
  }> {
    const retentionDays = await this.getRetentionDays(tenantId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.logger.log(`Cleaning up expired data for tenant ${tenantId} (retention: ${retentionDays} days)`);

    try {
      // Alte Conversations löschen
      const deletedConversations = await this.prisma.conversation.deleteMany({
        where: {
          tenantId,
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });

      // Alte Messages löschen
      const deletedMessages = await this.prisma.conversationMessage.deleteMany({
        where: {
          conversation: {
            tenantId,
          },
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // Alte Audit-Logs löschen (falls in DB gespeichert)
      // Hinweis: Audit-Logs werden primär in Redis Streams gespeichert
      // Diese werden automatisch über TTL gelöscht

      const result = {
        deletedConversations: deletedConversations.count,
        deletedMessages: deletedMessages.count,
        deletedAuditLogs: 0, // Wird über Redis TTL verwaltet
      };

      // Emit Compliance Event
      const event = ComplianceEventSchema.parse({
        id: uuid(),
        type: 'compliance.retention.cleanup',
        domain: EventDomain.COMPLIANCE,
        action: 'retention.cleanup',
        timestamp: Date.now(),
        sessionId: tenantId,
        tenantId,
        payload: {
          retentionDays,
          cutoffDate: cutoffDate.toISOString(),
          deletedCounts: result,
        },
      });

      await this.eventBus.emit(event);

      this.logger.log(
        `Retention cleanup completed for tenant ${tenantId}: ${result.deletedConversations} conversations, ${result.deletedMessages} messages`,
      );

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Retention cleanup failed for tenant ${tenantId}: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Alle Tenants bereinigen (für Cron-Job)
   */
  async cleanupAllTenants(): Promise<Record<string, { deletedConversations: number; deletedMessages: number }>> {
    this.logger.log('Starting retention cleanup for all tenants');

    // Alle Tenants aus DB laden
    const tenants = await this.prisma.tenantProfile.findMany({
      select: {
        tenantId: true,
      },
    });

    const results: Record<string, { deletedConversations: number; deletedMessages: number }> = {};

    for (const tenant of tenants) {
      try {
        const result = await this.cleanupExpiredData(tenant.tenantId);
        results[tenant.tenantId] = {
          deletedConversations: result.deletedConversations,
          deletedMessages: result.deletedMessages,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to cleanup tenant ${tenant.tenantId}: ${errorMessage}`);
        results[tenant.tenantId] = {
          deletedConversations: 0,
          deletedMessages: 0,
        };
      }
    }

    this.logger.log(`Retention cleanup completed for ${tenants.length} tenants`);
    return results;
  }

  /**
   * Prüfe ob Daten abgelaufen sind
   */
  async isDataExpired(tenantId: string, createdAt: Date): Promise<boolean> {
    const retentionDays = await this.getRetentionDays(tenantId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    return createdAt < cutoffDate;
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Prüfe ob DB-Verbindung funktioniert
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}






