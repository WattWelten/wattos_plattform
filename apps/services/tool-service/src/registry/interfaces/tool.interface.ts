/**
 * Tool Definition
 */
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  type: 'http' | 'email' | 'jira' | 'slack' | 'code' | 'retrieval' | 'custom';
  schema: ToolSchema;
  adapter: string; // Adapter-Klasse
  requiresAuth?: boolean;
  requiresApproval?: boolean;
  timeout?: number;
  retryCount?: number;
}

/**
 * Tool Schema (JSON Schema)
 */
export interface ToolSchema {
  type: 'object';
  properties: Record<string, ToolProperty>;
  required?: string[];
}

/**
 * Tool Property
 */
export interface ToolProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: any[];
  default?: any;
}

/**
 * Tool Execution Request
 */
export interface ToolExecutionRequest {
  toolId: string;
  input: Record<string, any>;
  tenantId: string;
  userId?: string;
  agentRunId?: string;
}

/**
 * Tool Execution Result
 */
export interface ToolExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
  metadata?: Record<string, any>;
}

/**
 * Tool Registry Interface
 */
export interface IToolRegistry {
  register(tool: ToolDefinition): void;
  get(toolId: string): ToolDefinition | null;
  getAll(): ToolDefinition[];
  unregister(toolId: string): void;
}


