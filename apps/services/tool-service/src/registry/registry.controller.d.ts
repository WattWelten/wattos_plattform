import { RegistryService } from './registry.service';
import { ToolDefinition } from './interfaces/tool.interface';
export declare class RegistryController {
    private readonly registryService;
    constructor(registryService: RegistryService);
    getAllTools(): ToolDefinition[];
    getTool(toolId: string): ToolDefinition | {
        error: string;
    };
    registerTool(tool: ToolDefinition): {
        success: boolean;
        toolId: string;
    };
    unregisterTool(toolId: string): {
        success: boolean;
    };
}
//# sourceMappingURL=registry.controller.d.ts.map