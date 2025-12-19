// ============================================
// PERMISSIONS
// ============================================

export const PERMISSIONS = {
  // Knowledge Spaces
  KNOWLEDGE_SPACE_READ: 'knowledge_space:read',
  KNOWLEDGE_SPACE_WRITE: 'knowledge_space:write',
  KNOWLEDGE_SPACE_DELETE: 'knowledge_space:delete',
  
  // Documents
  DOCUMENT_READ: 'document:read',
  DOCUMENT_WRITE: 'document:write',
  DOCUMENT_DELETE: 'document:delete',
  
  // Agents
  AGENT_READ: 'agent:read',
  AGENT_WRITE: 'agent:write',
  AGENT_EXECUTE: 'agent:execute',
  AGENT_DELETE: 'agent:delete',
  
  // Admin
  ADMIN_USERS: 'admin:users',
  ADMIN_ROLES: 'admin:roles',
  ADMIN_TENANTS: 'admin:tenants',
  ADMIN_SETTINGS: 'admin:settings',
  
  // Chat
  CHAT_READ: 'chat:read',
  CHAT_WRITE: 'chat:write',
} as const;

// ============================================
// AGENT ROLES
// ============================================

export const AGENT_ROLES = {
  IT_SUPPORT: 'it-support',
  SALES_ASSIST: 'sales-assist',
  MEETING_NOTES: 'meeting-notes',
  MARKETING_ASSIST: 'marketing-assist',
  LEGAL_ASSIST: 'legal-assist',
} as const;

// ============================================
// LLM PROVIDERS
// ============================================

export const LLM_PROVIDERS = {
  OPENAI: 'openai',
  AZURE: 'azure',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  OLLAMA: 'ollama',
} as const;

// ============================================
// VECTOR STORE TYPES
// ============================================

export const VECTOR_STORE_TYPES = {
  PGVECTOR: 'pgvector',
  OPENSEARCH: 'opensearch',
} as const;

// ============================================
// FILE TYPES
// ============================================

export const SUPPORTED_FILE_TYPES = [
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.txt',
  '.md',
  '.html',
  '.csv',
  '.rtf',
  '.odt',
  '.epub',
] as const;

// ============================================
// CHUNKING STRATEGIES
// ============================================

export const CHUNKING_STRATEGIES = {
  TITLE_BASED: 'title-based',
  SENTENCE_BASED: 'sentence-based',
  FIXED_SIZE: 'fixed-size',
} as const;


