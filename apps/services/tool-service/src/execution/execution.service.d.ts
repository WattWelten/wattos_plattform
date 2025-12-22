import { ConfigService } from '@nestjs/config';
import { ToolDefinition, ToolExecutionRequest, ToolExecutionResult } from '../registry/interfaces/tool.interface';
import { IToolAdapter } from '../adapters/interfaces/adapter.interface';
export declare class ExecutionService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    execute(request: ToolExecutionRequest, tool: ToolDefinition, adapter: IToolAdapter): Promise<ToolExecutionResult>;
    private createTimeout;
}
//# sourceMappingURL=execution.service.d.ts.map