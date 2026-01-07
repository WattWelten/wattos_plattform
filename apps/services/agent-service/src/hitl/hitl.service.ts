import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AgentService } from '../agent/agent.service';
import { ServiceDiscoveryService } from '@wattweiser/shared';

/**
 * Human-in-the-Loop Service
 * Verwaltet Approval-Workflows und Eskalationen
 */
@Injectable()
export class HitlService {
  private readonly logger = new Logger(HitlService.name);
  private pendingApprovals: Map<string, any> = new Map();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => AgentService))
    private readonly agentService: AgentService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  /**
   * Approval anfordern
   */
  async requestApproval(
    runId: string,
    toolCallId: string,
    action: string,
    context: Record<string, any>,
    approverId?: string,
  ) {
    const approvalId = `approval_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const approval = {
      id: approvalId,
      runId,
      toolCallId,
      action,
      context,
      status: 'pending',
      requestedAt: new Date(),
      approverId,
    };

    this.pendingApprovals.set(approvalId, approval);

    // Notification an Approver senden
    if (approverId) {
      await this.sendNotification(approverId, approval);
    } else {
      // Fallback: Notification an Agent-Besitzer oder Admin
      const agentRun = await this.prismaService.client.agentRun.findUnique({
        where: { id: runId },
        include: {
          agent: {
            include: {
              tenant: {
                include: {
                  users: {
                    include: {
                      userRoles: {
                        include: {
                          role: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (agentRun?.agent?.tenant?.users) {
        // Finde Admin-User
        const adminUser = agentRun.agent.tenant.users.find(
          (u) => u.userRoles.some((ur) => ur.role.name === 'admin' || ur.role.name === 'owner'),
        );

        if (adminUser) {
          await this.sendNotification(adminUser.id, approval);
        }
      }
    }

    // Agent-Run Status aktualisieren
    await this.prismaService.client.agentRun.update({
      where: { id: runId },
      data: { status: 'waiting_approval' },
    });

    return approval;
  }

  /**
   * Notification senden
   */
  private async sendNotification(userId: string, approval: any): Promise<void> {
    try {
      // User aus DB laden
      const user = await this.prismaService.client.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.email) {
        this.logger.warn(`Cannot send notification: User ${userId} not found or has no email`);
        return;
      }

      // Notification über Email oder interne Notification-API senden
      this.logger.log(
        `Sending approval notification to ${user.email} for approval ${approval.id}`,
      );

      // Integration mit Notification-Service (falls konfiguriert)
      const notificationServiceUrl = this.configService.get<string>('NOTIFICATION_SERVICE_URL');
      const gatewayUrl = this.configService.get<string>('GATEWAY_URL', 'http://localhost:3001');
      
      if (notificationServiceUrl) {
        try {
          await firstValueFrom(
            this.httpService.post(`${notificationServiceUrl}/notifications`, {
              userId,
              type: 'approval_request',
              title: 'Agent-Aktion erfordert Genehmigung',
              message: `Agent-Run ${approval.runId} benötigt Ihre Genehmigung für: ${approval.action}`,
              actionUrl: `${gatewayUrl}/api/admin/approvals/${approval.id}`,
              metadata: {
                approvalId: approval.id,
                runId: approval.runId,
                action: approval.action,
              },
            }),
          );
          this.logger.log(`Notification sent via service to user ${userId}`);
        } catch (error: any) {
          this.logger.warn(`Failed to send notification via service: ${error.message}, falling back to email`);
          // Fallback: Direkte Email über Tool-Service
          await this.sendEmailNotification(user.email, approval);
        }
      } else {
        // Fallback: Direkte Email über Tool-Service
        await this.sendEmailNotification(user.email, approval);
      }
    } catch (error: any) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }

  /**
   * Email-Notification über Tool-Service senden
   */
  private async sendEmailNotification(email: string, approval: any): Promise<void> {
    try {
      const toolServiceUrl = this.serviceDiscovery.getServiceUrl('tool-service', 3005);
      const gatewayUrl = this.configService.get<string>('GATEWAY_URL', 'http://localhost:3001');

      await firstValueFrom(
        this.httpService.post(`${toolServiceUrl}/tools/execute`, {
          toolId: 'email',
          input: {
            to: email,
            subject: 'Agent-Aktion erfordert Genehmigung',
            body: `
              Ein Agent-Run benötigt Ihre Genehmigung.
              
              Details:
              - Run ID: ${approval.runId}
              - Aktion: ${approval.action}
              - Kontext: ${JSON.stringify(approval.context, null, 2)}
              
              Bitte genehmigen oder ablehnen Sie diese Aktion:
              ${gatewayUrl}/api/admin/approvals/${approval.id}
            `,
            html: `
              <h2>Agent-Aktion erfordert Genehmigung</h2>
              <p>Ein Agent-Run benötigt Ihre Genehmigung.</p>
              <ul>
                <li><strong>Run ID:</strong> ${approval.runId}</li>
                <li><strong>Aktion:</strong> ${approval.action}</li>
                <li><strong>Kontext:</strong> <pre>${JSON.stringify(approval.context, null, 2)}</pre></li>
              </ul>
              <p>
                <a href="${gatewayUrl}/api/admin/approvals/${approval.id}">Aktion genehmigen/ablehnen</a>
              </p>
            `,
          },
        }),
      );
      this.logger.log(`Email notification sent to ${email}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email notification: ${error.message}`);
    }
  }

  /**
   * Approval genehmigen
   */
  async approve(approvalId: string, approverId: string) {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    approval.status = 'approved';
    approval.approvedBy = approverId;
    approval.approvedAt = new Date();

    // Agent-Run fortsetzen
    await this.resumeAgentRun(approval.runId, approval);

    return approval;
  }

  /**
   * Approval ablehnen
   */
  async reject(approvalId: string, approverId: string, reason?: string) {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    approval.status = 'rejected';
    approval.rejectedBy = approverId;
    approval.rejectedAt = new Date();
    approval.reason = reason;

    // Agent-Run abbrechen
    await this.cancelAgentRun(approval.runId, reason);

    return approval;
  }

  /**
   * Agent-Run fortsetzen nach Approval
   */
  private async resumeAgentRun(runId: string, approval: any): Promise<void> {
    try {
      // Agent-Run aus DB laden
      const agentRun = await this.prismaService.client.agentRun.findUnique({
        where: { id: runId },
        include: { agent: true },
      });

      if (!agentRun) {
        throw new Error(`Agent run ${runId} not found`);
      }

      // Status auf "running" setzen
      await this.prismaService.client.agentRun.update({
        where: { id: runId },
        data: { status: 'running' },
      });

      // Agent-Run mit GraphService fortsetzen
      this.logger.log(`Resuming agent run ${runId} after approval ${approval.id}`);
      
      try {
        await this.agentService.resumeRun(runId, approval);
      } catch (error: any) {
        this.logger.error(`Failed to resume agent run via AgentService: ${error.message}`);
        throw error;
      }
    } catch (error: any) {
      this.logger.error(`Failed to resume agent run: ${error.message}`);
      throw error;
    }
  }

  /**
   * Agent-Run abbrechen
   */
  private async cancelAgentRun(runId: string, reason?: string): Promise<void> {
    try {
      await this.prismaService.client.agentRun.update({
        where: { id: runId },
        data: {
          status: 'failed',
          output: reason ? `Abgebrochen: ${reason}` : 'Abgebrochen durch Approver',
          completedAt: new Date(),
        },
      });

      this.logger.log(`Agent run ${runId} cancelled: ${reason || 'No reason provided'}`);
    } catch (error: any) {
      this.logger.error(`Failed to cancel agent run: ${error.message}`);
      throw error;
    }
  }

  /**
   * Approval abrufen
   */
  async getApproval(approvalId: string) {
    return this.pendingApprovals.get(approvalId);
  }

  /**
   * Alle Pending Approvals abrufen
   */
  async getPendingApprovals(userId?: string) {
    const approvals = Array.from(this.pendingApprovals.values());
    return approvals.filter(
      (a) => a.status === 'pending' && (!userId || a.approverId === userId),
    );
  }
}

