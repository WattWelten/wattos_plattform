import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import { IToolAdapter } from '../interfaces/adapter.interface';
import { ToolExecutionRequest, ToolExecutionResult } from '../../registry/interfaces/tool.interface';

/**
 * Slack Adapter
 * Sendet Nachrichten in Slack-Kanäle
 */
@Injectable()
export class SlackAdapter implements IToolAdapter {
  private readonly logger = new Logger(SlackAdapter.name);
  private slackClient: WebClient | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient(): void {
    const slackConfig = this.configService.get('adapters.slack');

    if (!slackConfig?.token) {
      this.logger.warn('Slack adapter not configured');
      return;
    }

    this.slackClient = new WebClient(slackConfig.token);
  }

  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      if (!this.slackClient) {
        throw new Error('Slack adapter not configured');
      }

      const { channel, text, threadTs } = request.input;

      // Input validieren
      if (!channel || !text) {
        throw new Error('Channel and text are required');
      }

      // Slack-Nachricht senden
      const result = await this.slackClient.chat.postMessage({
        channel,
        text,
        thread_ts: threadTs,
      });

      const executionTime = Date.now() - startTime;

      this.logger.log(`Slack message sent: ${result.ts}`);

      return {
        success: true,
        output: {
          ts: result.ts,
          channel: result.channel,
          message: result.message,
        },
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      this.logger.error(`Slack message send failed: ${error.message}`);

      return {
        success: false,
        error: error.message || 'Slack message send failed',
        executionTime,
      };
    }
  }

  async validateInput(input: Record<string, any>): Promise<boolean> {
    if (!input.channel || !input.text) {
      return false;
    }

    if (typeof input.text !== 'string' || input.text.trim().length === 0) {
      return false;
    }

    return true;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.slackClient) {
      return false;
    }

    try {
      // Health-Check: Auth testen
      await this.slackClient.auth.test();
      return true;
    } catch {
      return false;
    }
  }
}


