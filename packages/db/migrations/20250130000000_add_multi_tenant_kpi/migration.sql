-- Migration: Add Multi-Tenant KPI Support
-- Enums, Schema Extensions, and AnswerSource Model

-- ============================================
-- CREATE ENUMS
-- ============================================

CREATE TYPE "RoleType" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');
CREATE TYPE "FeedbackType" AS ENUM ('UP', 'DOWN', 'STAR1', 'STAR2', 'STAR3', 'STAR4', 'STAR5');
CREATE TYPE "SourceType" AS ENUM ('FILE', 'WEBSITE', 'WEBDAV', 'SHAREPOINT', 'ONEDRIVE', 'GDRIVE', 'POSTGRES');
CREATE TYPE "Channel" AS ENUM ('WEB', 'AVATAR', 'VIDEO', 'PHONE');

-- ============================================
-- EXTEND AGENT TABLE
-- ============================================

ALTER TABLE "Agent" 
  ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS "model" TEXT,
  ADD COLUMN IF NOT EXISTS "prompt" TEXT,
  ADD COLUMN IF NOT EXISTS "toolsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "policy" JSONB;

CREATE INDEX IF NOT EXISTS "Agent_status_idx" ON "Agent"("status");

-- ============================================
-- EXTEND CONVERSATION TABLE
-- ============================================

ALTER TABLE "Conversation"
  ADD COLUMN IF NOT EXISTS "assistantId" TEXT,
  ADD COLUMN IF NOT EXISTS "channel" "Channel";

-- Add foreign key constraint for assistantId
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'Conversation_assistantId_fkey'
  ) THEN
    ALTER TABLE "Conversation" 
      ADD CONSTRAINT "Conversation_assistantId_fkey" 
      FOREIGN KEY ("assistantId") REFERENCES "Agent"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Conversation_assistantId_idx" ON "Conversation"("assistantId");
CREATE INDEX IF NOT EXISTS "Conversation_channel_idx" ON "Conversation"("channel");

-- ============================================
-- EXTEND CONVERSATIONMESSAGE TABLE
-- ============================================

ALTER TABLE "ConversationMessage"
  ADD COLUMN IF NOT EXISTS "lang" TEXT,
  ADD COLUMN IF NOT EXISTS "meta" JSONB,
  ADD COLUMN IF NOT EXISTS "tokensIn" INTEGER,
  ADD COLUMN IF NOT EXISTS "tokensOut" INTEGER,
  ADD COLUMN IF NOT EXISTS "costCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "solved" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "model" TEXT;

CREATE INDEX IF NOT EXISTS "ConversationMessage_solved_idx" ON "ConversationMessage"("solved");

-- ============================================
-- EXTEND ROLE TABLE
-- ============================================

ALTER TABLE "Role"
  ADD COLUMN IF NOT EXISTS "roleType" "RoleType";

CREATE INDEX IF NOT EXISTS "Role_roleType_idx" ON "Role"("roleType");

-- ============================================
-- EXTEND FEEDBACK TABLE
-- ============================================

-- First, make userId nullable if not already
ALTER TABLE "Feedback"
  ALTER COLUMN "userId" DROP NOT NULL;

-- Add new columns
ALTER TABLE "Feedback"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "queryId" TEXT,
  ADD COLUMN IF NOT EXISTS "type" "FeedbackType",
  ADD COLUMN IF NOT EXISTS "reason" TEXT;

-- Update existing rows: set tenantId from user if available
UPDATE "Feedback" f
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE f."userId" = u.id AND f."tenantId" = '';

-- For feedback without user, set to a default tenant (if exists)
-- Only update if at least one tenant exists
DO $$
DECLARE
  default_tenant_id TEXT;
BEGIN
  SELECT id INTO default_tenant_id FROM "Tenant" LIMIT 1;
  
  IF default_tenant_id IS NOT NULL THEN
    UPDATE "Feedback"
    SET "tenantId" = default_tenant_id
    WHERE "tenantId" = '';
  ELSE
    -- If no tenant exists, we cannot set tenantId - this will fail the migration
    -- This is intentional: tenantId is required for multi-tenant support
    RAISE EXCEPTION 'No tenant found. Cannot migrate Feedback without at least one tenant.';
  END IF;
END $$;

-- Make tenantId NOT NULL after data migration
ALTER TABLE "Feedback"
  ALTER COLUMN "tenantId" DROP DEFAULT;

-- Add foreign key constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'Feedback_tenantId_fkey'
  ) THEN
    ALTER TABLE "Feedback" 
      ADD CONSTRAINT "Feedback_tenantId_fkey" 
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'Feedback_queryId_fkey'
  ) THEN
    ALTER TABLE "Feedback" 
      ADD CONSTRAINT "Feedback_queryId_fkey" 
      FOREIGN KEY ("queryId") REFERENCES "ConversationMessage"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Feedback_tenantId_idx" ON "Feedback"("tenantId");
CREATE INDEX IF NOT EXISTS "Feedback_queryId_idx" ON "Feedback"("queryId");
CREATE INDEX IF NOT EXISTS "Feedback_tenantId_createdAt_idx" ON "Feedback"("tenantId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Feedback_tenantId_type_idx" ON "Feedback"("tenantId", "type");
CREATE INDEX IF NOT EXISTS "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- ============================================
-- EXTEND SOURCE TABLE
-- ============================================

ALTER TABLE "Source"
  ADD COLUMN IF NOT EXISTS "spaceId" TEXT,
  ADD COLUMN IF NOT EXISTS "type" "SourceType",
  ADD COLUMN IF NOT EXISTS "config" JSONB,
  ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';

-- Migrate existing type string to enum (if possible)
-- Note: This assumes existing types match enum values
UPDATE "Source" 
SET "type" = CASE 
  WHEN "type"::text = 'domain' THEN 'WEBSITE'::"SourceType"
  WHEN "type"::text = 'pattern' THEN 'WEBSITE'::"SourceType"
  WHEN "type"::text = 'file' THEN 'FILE'::"SourceType"
  ELSE 'FILE'::"SourceType"
END
WHERE "type" IS NULL OR "type"::text NOT IN ('FILE', 'WEBSITE', 'WEBDAV', 'SHAREPOINT', 'ONEDRIVE', 'GDRIVE', 'POSTGRES');

-- Add foreign key constraint for spaceId
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'Source_spaceId_fkey'
  ) THEN
    ALTER TABLE "Source" 
      ADD CONSTRAINT "Source_spaceId_fkey" 
      FOREIGN KEY ("spaceId") REFERENCES "KnowledgeSpace"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Source_spaceId_idx" ON "Source"("spaceId");
CREATE INDEX IF NOT EXISTS "Source_status_idx" ON "Source"("status");
CREATE INDEX IF NOT EXISTS "Source_type_idx" ON "Source"("type");

-- ============================================
-- CREATE ANSWER SOURCE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "AnswerSource" (
  "id" TEXT NOT NULL,
  "answerId" TEXT NOT NULL,
  "docId" TEXT,
  "chunkId" TEXT,
  "score" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AnswerSource_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'AnswerSource_answerId_fkey'
  ) THEN
    ALTER TABLE "AnswerSource" 
      ADD CONSTRAINT "AnswerSource_answerId_fkey" 
      FOREIGN KEY ("answerId") REFERENCES "ConversationMessage"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'AnswerSource_docId_fkey'
  ) THEN
    ALTER TABLE "AnswerSource" 
      ADD CONSTRAINT "AnswerSource_docId_fkey" 
      FOREIGN KEY ("docId") REFERENCES "Document"("id") ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'AnswerSource_chunkId_fkey'
  ) THEN
    ALTER TABLE "AnswerSource" 
      ADD CONSTRAINT "AnswerSource_chunkId_fkey" 
      FOREIGN KEY ("chunkId") REFERENCES "Chunk"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AnswerSource_answerId_idx" ON "AnswerSource"("answerId");
CREATE INDEX IF NOT EXISTS "AnswerSource_docId_idx" ON "AnswerSource"("docId");
CREATE INDEX IF NOT EXISTS "AnswerSource_chunkId_idx" ON "AnswerSource"("chunkId");
CREATE INDEX IF NOT EXISTS "AnswerSource_score_idx" ON "AnswerSource"("score");

-- ============================================
-- EXTEND EVENT TABLE (if needed)
-- ============================================

-- Event table already has payloadJsonb, we can use it as payload
-- No changes needed, but ensure type column supports new event types

-- ============================================
-- VERIFY PGVECTOR EXTENSION
-- ============================================

-- pgvector should already be enabled, but verify
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify Chunk table has embedding column (should already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Chunk' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE "Chunk" ADD COLUMN "embedding" vector(1536);
  END IF;
END $$;
