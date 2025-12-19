import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JiraApi } from 'jira.js';
import { IToolAdapter } from '../interfaces/adapter.interface';
import { ToolExecutionRequest, ToolExecutionResult } from '../../registry/interfaces/tool.interface';

/**
 * Jira Adapter
 * Erstellt und verwaltet Jira-Tickets
 */
@Injectable()
export class JiraAdapter implements IToolAdapter {
  private readonly logger = new Logger(JiraAdapter.name);
  private jiraClient: JiraApi | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient(): void {
    const jiraConfig = this.configService.get('adapters.jira');

    if (!jiraConfig?.host || !jiraConfig?.email || !jiraConfig?.apiToken) {
      this.logger.warn('Jira adapter not configured');
      return;
    }

    this.jiraClient = new JiraApi({
      host: jiraConfig.host,
      authentication: {
        basic: {
          email: jiraConfig.email,
          apiToken: jiraConfig.apiToken,
        },
      },
    });
  }

  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      if (!this.jiraClient) {
        throw new Error('Jira adapter not configured');
      }

      const { projectKey, summary, description, issueType = 'Task', priority = 'Medium' } = request.input;

      // Input validieren
      if (!projectKey || !summary || !description) {
        throw new Error('Project key, summary, and description are required');
      }

      // Jira-Ticket erstellen
      const issue = await this.jiraClient.issues.createIssue({
        fields: {
          project: {
            key: projectKey,
          },
          summary,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: description,
                  },
                ],
              },
            ],
          },
          issuetype: {
            name: issueType,
          },
          priority: {
            name: priority,
          },
        },
      });

      const executionTime = Date.now() - startTime;

      this.logger.log(`Jira issue created: ${issue.key}`);

      return {
        success: true,
        output: {
          key: issue.key,
          id: issue.id,
          self: issue.self,
        },
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      this.logger.error(`Jira issue creation failed: ${error.message}`);

      return {
        success: false,
        error: error.message || 'Jira issue creation failed',
        executionTime,
      };
    }
  }

  async validateInput(input: Record<string, any>): Promise<boolean> {
    if (!input.projectKey || !input.summary || !input.description) {
      return false;
    }

    const validIssueTypes = ['Bug', 'Task', 'Story', 'Epic'];
    if (input.issueType && !validIssueTypes.includes(input.issueType)) {
      return false;
    }

    const validPriorities = ['Lowest', 'Low', 'Medium', 'High', 'Highest'];
    if (input.priority && !validPriorities.includes(input.priority)) {
      return false;
    }

    return true;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.jiraClient) {
      return false;
    }

    try {
      // Einfacher Health-Check: Server-Info abrufen
      await this.jiraClient.serverInfo.getServerInfo();
      return true;
    } catch {
      return false;
    }
  }
}


