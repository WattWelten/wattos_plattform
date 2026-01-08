-- Migration: Query Optimization Indexes
-- Sprint 4: Database Query Optimization
-- Hinzugefügt: 2026-01-08

-- LLMUsage: Composite Index für tenant-spezifische Queries mit Sortierung
CREATE INDEX IF NOT EXISTS "LLMUsage_tenantId_createdAt_idx" ON "LLMUsage"("tenantId", "createdAt" DESC);

-- LLMUsage: Composite Index für Provider-Analysen
CREATE INDEX IF NOT EXISTS "LLMUsage_tenantId_provider_createdAt_idx" ON "LLMUsage"("tenantId", "provider", "createdAt" DESC);

-- ConversationMessage: Composite Index für Message-Sortierung
CREATE INDEX IF NOT EXISTS "ConversationMessage_conversationId_createdAt_idx" ON "ConversationMessage"("conversationId", "createdAt" ASC);

-- Feedback: Composite Index für User-Feedback-Historie
CREATE INDEX IF NOT EXISTS "Feedback_userId_createdAt_idx" ON "Feedback"("userId", "createdAt" DESC);

-- Feedback: Composite Index für Feedback-Typ-Filterung
CREATE INDEX IF NOT EXISTS "Feedback_userId_type_idx" ON "Feedback"("userId", "type");

-- AgentRun: Composite Index für Agent-Run-Queries
CREATE INDEX IF NOT EXISTS "AgentRun_agentId_status_createdAt_idx" ON "AgentRun"("agentId", "status", "createdAt" DESC);

-- AgentRun: Composite Index für User-Run-Queries
CREATE INDEX IF NOT EXISTS "AgentRun_userId_status_createdAt_idx" ON "AgentRun"("userId", "status", "createdAt" DESC);

-- CustomerAnalysis: Composite Index für Analysis-Queries
CREATE INDEX IF NOT EXISTS "CustomerAnalysis_tenantId_status_createdAt_idx" ON "CustomerAnalysis"("tenantId", "status", "createdAt" DESC);

-- KBArticle: Composite Index für Published-Articles
CREATE INDEX IF NOT EXISTS "KBArticle_tenantId_status_publishedAt_idx" ON "KBArticle"("tenantId", "status", "publishedAt" DESC);
