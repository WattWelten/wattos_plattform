import { ToolExecutionRequest, ToolExecutionResult } from '../../registry/interfaces/tool.interface';
export interface IToolAdapter {
    execute(request: ToolExecutionRequest): Promise<ToolExecutionResult>;
    validateInput(input: Record<string, any>): Promise<boolean>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=adapter.interface.d.ts.map