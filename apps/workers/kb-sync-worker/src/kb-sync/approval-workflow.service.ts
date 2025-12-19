import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { EventBusService, EventDomain } from '@wattweiser/core';

/**
 * Approval Workflow Service
 * 
 * Human-in-the-Loop Approval-Workflow für KB-Artikel-Synchronisation
 */
@Injectable()
export class ApprovalWorkflowService {
  private readonly logger = new Logger(ApprovalWorkflowService.name);
  private readonly prisma: PrismaClient;

  constructor(private readonly eventBus: EventBusService) {
    this.prisma = new PrismaClient();
  }

  /**
   * Approval anfordern
   */
  async requestApproval(tenantId: string, articleId: string): Promise<void> {
    try {
      // Status auf "pending" setzen
      await this.prisma.kBArticle.update({
        where: { id: articleId },
        data: {
          f13SyncStatus: 'pending',
        },
      });

      // Approval-Event emittieren (für UI/Dashboard)
      const article = await this.prisma.kBArticle.findUnique({ where: { id: articleId } });
      await this.eventBus.emit({
        id: `approval-request-${Date.now()}`,
        type: `${EventDomain.KNOWLEDGE}.article.approval.requested`,
        domain: EventDomain.KNOWLEDGE,
        timestamp: Date.now(),
        tenantId,
        sessionId: `workflow-${tenantId}`, // Placeholder für Workflow-Events
        payload: {
          articleId,
          title: article?.title,
        },
        metadata: {
          workflow: 'approval',
        },
      } as any);

      this.logger.log(`Approval requested for KB Article: ${articleId}`, { tenantId });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to request approval: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Approval erteilen
   */
  async approve(tenantId: string, articleId: string, approvedBy: string): Promise<void> {
    try {
      // Status auf "approved" setzen
      await this.prisma.kBArticle.update({
        where: { id: articleId },
        data: {
          status: 'approved',
        },
      });

      // Approval-Event emittieren
      await this.eventBus.emit({
        id: `approval-granted-${Date.now()}`,
        type: `${EventDomain.KNOWLEDGE}.article.approved`,
        domain: EventDomain.KNOWLEDGE,
        timestamp: Date.now(),
        tenantId,
        sessionId: `workflow-${tenantId}`, // Placeholder für Workflow-Events
        payload: {
          articleId,
          approvedBy,
        },
        metadata: {
          workflow: 'approval',
        },
      } as any);

      this.logger.log(`KB Article approved: ${articleId}`, { tenantId, approvedBy });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to approve article: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Approval ablehnen
   */
  async reject(tenantId: string, articleId: string, rejectedBy: string, reason?: string): Promise<void> {
    try {
      // Status auf "rejected" setzen
      await this.prisma.kBArticle.update({
        where: { id: articleId },
        data: {
          f13SyncStatus: 'rejected',
        },
      });

      // Rejection-Event emittieren
      await this.eventBus.emit({
        id: `approval-rejected-${Date.now()}`,
        type: `${EventDomain.KNOWLEDGE}.article.rejected`,
        domain: EventDomain.KNOWLEDGE,
        timestamp: Date.now(),
        tenantId,
        sessionId: `workflow-${tenantId}`, // Placeholder für Workflow-Events
        payload: {
          articleId,
          rejectedBy,
          reason,
        },
        metadata: {
          workflow: 'approval',
        },
      } as any);

      this.logger.log(`KB Article rejected: ${articleId}`, { tenantId, rejectedBy, reason });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to reject article: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Pending Approvals abrufen
   */
  async getPendingApprovals(tenantId: string): Promise<Array<{
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    try {
      const articles = await this.prisma.kBArticle.findMany({
        where: {
          tenantId,
          f13SyncStatus: 'pending',
          status: 'published',
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return articles;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get pending approvals: ${errorMessage}`);
      return [];
    }
  }
}

