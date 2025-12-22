import { ConfigService } from '@nestjs/config';
import { IToolAdapter } from '../interfaces/adapter.interface';
import { ToolExecutionRequest, ToolExecutionResult } from '../../registry/interfaces/tool.interface';
export declare class JiraAdapter implements IToolAdapter {
    private readonly configService;
    private readonly logger;
    private jiraClient;
    constructor(configService: ConfigService);
    private initializeClient;
    execute(request: ToolExecutionRequest): Promise<ToolExecutionResult>;
    validateInput(input: Record<string, any>): Promise<boolean>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=jira.adapter.d.ts.map