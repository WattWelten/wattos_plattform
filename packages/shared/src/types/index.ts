// ============================================
// CORE TYPES
// ============================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  passwordHash?: string;
  keycloakId?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  permissions: string[];
  createdAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

// ============================================
// KNOWLEDGE SPACE & RAG
// ============================================

export interface KnowledgeSpace {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  knowledgeSpaceId: string;
  filePath: string;
  fileName: string;
  fileType?: string;
  fileSize: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, any>;
  embedding?: number[];
  createdAt: Date;
}

// ============================================
// AGENTS
// ============================================

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  roleType: string;
  personaConfig: Record<string, any>;
  toolsConfig: string[];
  policiesConfig: Record<string, any>;
  kpiConfig: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentRun {
  id: string;
  agentId: string;
  userId?: string;
  input: string;
  output?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  metrics: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export interface ToolCall {
  id: string;
  agentRunId: string;
  toolName: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  createdAt: Date;
}

// ============================================
// LLM
// ============================================

export type LLMProvider = 'openai' | 'azure' | 'anthropic' | 'google' | 'ollama';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMUsage {
  id: string;
  tenantId: string;
  provider: LLMProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  createdAt: Date;
}

// ============================================
// CHAT
// ============================================

export interface Chat {
  id: string;
  userId: string;
  tenantId: string;
  title?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface Citation {
  documentId: string;
  chunkId: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

// ============================================
// AUDIT
// ============================================

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


