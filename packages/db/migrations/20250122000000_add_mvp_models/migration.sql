-- Migration: Add MVP Models (Sources, Crawls, Events, Configs, Indices)
-- Erweitert Conversation und ConversationMessage
-- Erweitert Artifact um tenantId und hash

-- Alter Conversation table
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Alter ConversationMessage table
ALTER TABLE "ConversationMessage" ADD COLUMN IF NOT EXISTS "latencyMs" INTEGER;
ALTER TABLE "ConversationMessage" ADD COLUMN IF NOT EXISTS "sourcesJsonb" JSONB;

-- Alter Artifact table
ALTER TABLE "Artifact" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Artifact" ADD COLUMN IF NOT EXISTS "hash" TEXT;
ALTER TABLE "Artifact" ALTER COLUMN "characterId" DROP NOT NULL;
ALTER TABLE "Artifact" ALTER COLUMN "url" TYPE TEXT;

-- Create Source table
CREATE TABLE IF NOT EXISTS "Source" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- Create Crawl table
CREATE TABLE IF NOT EXISTS "Crawl" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "pages" INTEGER NOT NULL DEFAULT 0,
    "delta" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "log" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crawl_pkey" PRIMARY KEY ("id")
);

-- Create Event table
CREATE TABLE IF NOT EXISTS "Event" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "payloadJsonb" JSONB NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- Create Config table
CREATE TABLE IF NOT EXISTS "Config" (
    "tenantId" TEXT NOT NULL,
    "jsonb" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("tenantId")
);

-- Create Index table
CREATE TABLE IF NOT EXISTS "Index" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "statsJsonb" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Index_pkey" PRIMARY KEY ("id")
);

-- Create indexes for Conversation
CREATE INDEX IF NOT EXISTS "Conversation_tenantId_idx" ON "Conversation"("tenantId");
CREATE INDEX IF NOT EXISTS "Conversation_sessionId_idx" ON "Conversation"("sessionId");
CREATE INDEX IF NOT EXISTS "Conversation_startedAt_idx" ON "Conversation"("startedAt");

-- Create indexes for Source
CREATE INDEX IF NOT EXISTS "Source_tenantId_idx" ON "Source"("tenantId");
CREATE INDEX IF NOT EXISTS "Source_url_idx" ON "Source"("url");
CREATE INDEX IF NOT EXISTS "Source_enabled_idx" ON "Source"("enabled");

-- Create indexes for Crawl
CREATE INDEX IF NOT EXISTS "Crawl_tenantId_idx" ON "Crawl"("tenantId");
CREATE INDEX IF NOT EXISTS "Crawl_sourceId_idx" ON "Crawl"("sourceId");
CREATE INDEX IF NOT EXISTS "Crawl_status_idx" ON "Crawl"("status");
CREATE INDEX IF NOT EXISTS "Crawl_startedAt_idx" ON "Crawl"("startedAt");

-- Create indexes for Event
CREATE INDEX IF NOT EXISTS "Event_tenantId_idx" ON "Event"("tenantId");
CREATE INDEX IF NOT EXISTS "Event_conversationId_idx" ON "Event"("conversationId");
CREATE INDEX IF NOT EXISTS "Event_sessionId_idx" ON "Event"("sessionId");
CREATE INDEX IF NOT EXISTS "Event_type_idx" ON "Event"("type");
CREATE INDEX IF NOT EXISTS "Event_ts_idx" ON "Event"("ts");

-- Create indexes for Index
CREATE INDEX IF NOT EXISTS "Index_tenantId_idx" ON "Index"("tenantId");
CREATE INDEX IF NOT EXISTS "Index_name_idx" ON "Index"("name");

-- Create indexes for Artifact
CREATE INDEX IF NOT EXISTS "Artifact_tenantId_idx" ON "Artifact"("tenantId");
CREATE INDEX IF NOT EXISTS "Artifact_hash_idx" ON "Artifact"("hash");
CREATE INDEX IF NOT EXISTS "Artifact_url_idx" ON "Artifact"("url");

-- Add foreign keys
ALTER TABLE "Source" ADD CONSTRAINT "Source_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Crawl" ADD CONSTRAINT "Crawl_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Crawl" ADD CONSTRAINT "Crawl_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Config" ADD CONSTRAINT "Config_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Index" ADD CONSTRAINT "Index_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

