import { ToolService } from './tool.service';
import { ToolExecutionRequest } from '../registry/interfaces/tool.interface';
export declare class ToolController {
    private readonly toolService;
    constructor(toolService: ToolService);
    executeTool(request: ToolExecutionRequest): Promise<import("../registry/interfaces/tool.interface").ToolExecutionResult>;
    healthCheck(toolId: string): Promise<{
        toolId: string;
        healthy: boolean;
    }>;
}
//# sourceMappingURL=tool.controller.d.ts.map