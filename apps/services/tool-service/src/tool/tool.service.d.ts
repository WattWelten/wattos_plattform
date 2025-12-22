import { RegistryService } from '../registry/registry.service';
import { AdapterFactory } from '../adapters/adapter.factory';
import { ExecutionService } from '../execution/execution.service';
import { ToolExecutionRequest, ToolExecutionResult } from '../registry/interfaces/tool.interface';
export declare class ToolService {
    private readonly registryService;
    private readonly adapterFactory;
    private readonly executionService;
    private readonly logger;
    constructor(registryService: RegistryService, adapterFactory: AdapterFactory, executionService: ExecutionService);
    executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResult>;
    healthCheck(toolId: string): Promise<boolean>;
}
//# sourceMappingURL=tool.service.d.ts.map