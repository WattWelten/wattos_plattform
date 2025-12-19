import { Agent as AgentType, AgentRun, LLMProvider } from '@wattweiser/shared';

/**
 * Agent State während der Ausführung
 */
export interface AgentState {
  agentId: string;
  tenantId: string;
  userId?: string;
  input: string;
  output?: string;
  messages: AgentMessage[];
  toolCalls: ToolCallResult[];
  memory: MemoryContext;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  error?: string;
  metrics: AgentMetrics;
  metadata: Record<string, any>;
}

/**
 * Agent Message (erweitert LLMMessage)
 */
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
}

/**
 * Tool Call Request
 */
export interface ToolCall {
  id: string;
  toolName: string;
  input: Record<string, any>;
  requiresApproval?: boolean;
}

/**
 * Tool Call Result
 */
export interface ToolCallResult {
  id: string;
  toolName: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  approved?: boolean;
  timestamp: Date;
}

/**
 * Memory Context
 */
export interface MemoryContext {
  conversationHistory: AgentMessage[];
  longTermFacts: Record<string, any>;
  compressedHistory?: string;
  tokenCount: number;
  maxTokens: number;
}

/**
 * Agent Metrics
 */
export interface AgentMetrics {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  costUsd: number;
  toolCallsCount: number;
  retryCount: number;
  kpiMetrics: Record<string, any>;
}

/**
 * Persona Configuration
 */
export interface PersonaConfig {
  name: string;
  tone: 'formal' | 'casual' | 'friendly' | 'professional' | 'technical';
  style: string;
  goal: string;
  constraints: string[];
  examples?: string[];
}

/**
 * Policy Configuration
 */
export interface PolicyConfig {
  guardrails: Guardrail[];
  piiRedaction: boolean;
  approvalWorkflows: ApprovalWorkflow[];
  complianceChecks: ComplianceCheck[];
}

/**
 * Guardrail
 */
export interface Guardrail {
  id: string;
  name: string;
  condition: string; // z.B. "toolName === 'admin_command'"
  action: 'block' | 'require_approval' | 'warn' | 'log';
  message?: string;
}

/**
 * Approval Workflow
 */
export interface ApprovalWorkflow {
  id: string;
  trigger: string; // z.B. "cost > 10" oder "toolName === 'send_email'"
  approverRole?: string;
  timeout?: number; // in Sekunden
}

/**
 * Compliance Check
 */
export interface ComplianceCheck {
  id: string;
  type: 'pii_detection' | 'data_classification' | 'access_control';
  config: Record<string, any>;
}

/**
 * Evaluation Hook Context
 */
export interface EvaluationContext {
  agentId: string;
  runId: string;
  state: AgentState;
  phase: 'pre_execution' | 'post_execution' | 'error' | 'kpi_tracking';
}

/**
 * Evaluation Hook Result
 */
export interface EvaluationResult {
  success: boolean;
  message?: string;
  metrics?: Record<string, any>;
  shouldRetry?: boolean;
  shouldEscalate?: boolean;
}

/**
 * Agent Configuration
 */
export interface AgentConfig {
  agent: AgentType;
  persona: PersonaConfig;
  policies: PolicyConfig;
  kpi: Record<string, any>;
  llmConfig: {
    provider: LLMProvider;
    model: string;
    fallbackProvider?: LLMProvider;
    fallbackModel?: string;
    temperature?: number;
    maxTokens?: number;
  };
  memoryConfig: {
    maxTokens: number;
    compressionThreshold: number;
    longTermStorage: boolean;
  };
}

/**
 * Agent Base Interface
 */
export interface IAgent {
  id: string;
  tenantId: string;
  config: AgentConfig;

  initialize(): Promise<void>;
  run(input: string, userId?: string): Promise<AgentRun>;
  cleanup(): Promise<void>;
  getState(runId: string): Promise<AgentState | null>;
}


