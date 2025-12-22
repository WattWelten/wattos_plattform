import { OnModuleInit } from '@nestjs/common';
import { ToolDefinition, IToolRegistry } from './interfaces/tool.interface';
export declare class RegistryService implements IToolRegistry, OnModuleInit {
    private readonly logger;
    private tools;
    onModuleInit(): Promise<void>;
    register(tool: ToolDefinition): void;
    get(toolId: string): ToolDefinition | null;
    getAll(): ToolDefinition[];
    unregister(toolId: string): void;
    private registerDefaultTools;
}
//# sourceMappingURL=registry.service.d.ts.map