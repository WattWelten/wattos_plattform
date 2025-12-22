import { HttpAdapter } from './http/http.adapter';
import { EmailAdapter } from './email/email.adapter';
import { JiraAdapter } from './jira/jira.adapter';
import { SlackAdapter } from './slack/slack.adapter';
import { RetrievalAdapter } from './retrieval/retrieval.adapter';
import { IToolAdapter } from './interfaces/adapter.interface';
export declare class AdapterFactory {
    private readonly httpAdapter;
    private readonly emailAdapter;
    private readonly jiraAdapter;
    private readonly slackAdapter;
    private readonly retrievalAdapter;
    private readonly logger;
    private adapters;
    constructor(httpAdapter: HttpAdapter, emailAdapter: EmailAdapter, jiraAdapter: JiraAdapter, slackAdapter: SlackAdapter, retrievalAdapter: RetrievalAdapter);
    private registerAdapters;
    getAdapter(adapterName: string): IToolAdapter | null;
    getAllAdapters(): Map<string, IToolAdapter>;
}
//# sourceMappingURL=adapter.factory.d.ts.map