import { ConfigService } from '@nestjs/config';
import { IToolAdapter } from '../interfaces/adapter.interface';
import { ToolExecutionRequest, ToolExecutionResult } from '../../registry/interfaces/tool.interface';
export declare class SlackAdapter implements IToolAdapter {
    private readonly configService;
    private readonly logger;
    private slackClient;
    constructor(configService: ConfigService);
    private initializeClient;
    execute(request: ToolExecutionRequest): Promise<ToolExecutionResult>;
    validateInput(input: Record<string, any>): Promise<boolean>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=slack.adapter.d.ts.map