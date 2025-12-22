export interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    type: 'http' | 'email' | 'jira' | 'slack' | 'code' | 'retrieval' | 'custom';
    schema: ToolSchema;
    adapter: string;
    requiresAuth?: boolean;
    requiresApproval?: boolean;
    timeout?: number;
    retryCount?: number;
}
export interface ToolSchema {
    type: 'object';
    properties: Record<string, ToolProperty>;
    required?: string[];
}
export interface ToolProperty {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description?: string;
    enum?: any[];
    default?: any;
}
export interface ToolExecutionRequest {
    toolId: string;
    input: Record<string, any>;
    tenantId: string;
    userId?: string;
    agentRunId?: string;
}
export interface ToolExecutionResult {
    success: boolean;
    output?: any;
    error?: string;
    executionTime: number;
    metadata?: Record<string, any>;
}
export interface IToolRegistry {
    register(tool: ToolDefinition): void;
    get(toolId: string): ToolDefinition | null;
    getAll(): ToolDefinition[];
    unregister(toolId: string): void;
}
//# sourceMappingURL=tool.interface.d.ts.map