import { Injectable, Logger } from '@nestjs/common';
import { HttpAdapter } from './http/http.adapter';
import { EmailAdapter } from './email/email.adapter';
import { JiraAdapter } from './jira/jira.adapter';
import { SlackAdapter } from './slack/slack.adapter';
import { RetrievalAdapter } from './retrieval/retrieval.adapter';
import { IToolAdapter } from './interfaces/adapter.interface';

/**
 * Adapter Factory
 * Erstellt Adapter-Instanzen basierend auf dem Adapter-Namen
 */
@Injectable()
export class AdapterFactory {
  private readonly logger = new Logger(AdapterFactory.name);
  private adapters: Map<string, IToolAdapter> = new Map();

  constructor(
    private readonly httpAdapter: HttpAdapter,
    private readonly emailAdapter: EmailAdapter,
    private readonly jiraAdapter: JiraAdapter,
    private readonly slackAdapter: SlackAdapter,
    private readonly retrievalAdapter: RetrievalAdapter,
  ) {
    this.registerAdapters();
  }

  private registerAdapters(): void {
    this.adapters.set('HttpAdapter', this.httpAdapter);
    this.adapters.set('EmailAdapter', this.emailAdapter);
    this.adapters.set('JiraAdapter', this.jiraAdapter);
    this.adapters.set('SlackAdapter', this.slackAdapter);
    this.adapters.set('RetrievalAdapter', this.retrievalAdapter);
  }

  /**
   * Adapter abrufen
   */
  getAdapter(adapterName: string): IToolAdapter | null {
    const adapter = this.adapters.get(adapterName);
    if (!adapter) {
      this.logger.warn(`Adapter ${adapterName} not found`);
      return null;
    }
    return adapter;
  }

  /**
   * Alle Adapter abrufen
   */
  getAllAdapters(): Map<string, IToolAdapter> {
    return this.adapters;
  }
}


