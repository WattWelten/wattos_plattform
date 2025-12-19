import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IToolAdapter } from '../interfaces/adapter.interface';
import { ToolExecutionRequest, ToolExecutionResult } from '../../registry/interfaces/tool.interface';

/**
 * Email Adapter
 * Sendet E-Mails über SMTP
 */
@Injectable()
export class EmailAdapter implements IToolAdapter {
  private readonly logger = new Logger(EmailAdapter.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const emailConfig = this.configService.get('adapters.email');

    if (!emailConfig?.host || !emailConfig?.user || !emailConfig?.password) {
      this.logger.warn('Email adapter not configured, emails will not be sent');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port || 587,
      secure: emailConfig.port === 465,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.password,
      },
    });
  }

  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      if (!this.transporter) {
        throw new Error('Email adapter not configured');
      }

      const { to, subject, body, cc, bcc } = request.input;

      // Input validieren
      if (!to || !subject || !body) {
        throw new Error('To, subject, and body are required');
      }

      // E-Mail senden
      const info = await this.transporter.sendMail({
        from: this.configService.get('adapters.email.user'),
        to: Array.isArray(to) ? to.join(', ') : to,
        cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
        subject,
        text: body,
        html: body, // Einfach: Text als HTML verwenden
      });

      const executionTime = Date.now() - startTime;

      this.logger.log(`Email sent: ${info.messageId}`);

      return {
        success: true,
        output: {
          messageId: info.messageId,
          response: info.response,
        },
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      this.logger.error(`Email send failed: ${error.message}`);

      return {
        success: false,
        error: error.message || 'Email send failed',
        executionTime,
      };
    }
  }

  async validateInput(input: Record<string, any>): Promise<boolean> {
    if (!input.to || !input.subject || !input.body) {
      return false;
    }

    // E-Mail-Format validieren
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toEmails = Array.isArray(input.to) ? input.to : [input.to];

    return toEmails.every((email: string) => emailRegex.test(email));
  }

  async healthCheck(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}


