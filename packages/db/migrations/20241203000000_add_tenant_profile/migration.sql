-- CreateTable: TenantProfile
CREATE TABLE IF NOT EXISTS "TenantProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "providers" JSONB NOT NULL DEFAULT '{}',
    "compliance" JSONB NOT NULL DEFAULT '{}',
    "features" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique tenantId
CREATE UNIQUE INDEX IF NOT EXISTS "TenantProfile_tenantId_key" ON "TenantProfile"("tenantId");

-- CreateIndex: Market index
CREATE INDEX IF NOT EXISTS "TenantProfile_market_idx" ON "TenantProfile"("market");

-- CreateIndex: Mode index
CREATE INDEX IF NOT EXISTS "TenantProfile_mode_idx" ON "TenantProfile"("mode");

-- CreateTable: ChannelSession
CREATE TABLE IF NOT EXISTS "ChannelSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "ChannelSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Tenant + Channel
CREATE INDEX IF NOT EXISTS "ChannelSession_tenantId_channel_idx" ON "ChannelSession"("tenantId", "channel");

-- CreateIndex: ChannelId
CREATE INDEX IF NOT EXISTS "ChannelSession_channelId_idx" ON "ChannelSession"("channelId");

-- CreateTable: ChannelMessage
CREATE TABLE IF NOT EXISTS "ChannelMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "audioUrl" TEXT,
    "mediaUrl" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Session + CreatedAt
CREATE INDEX IF NOT EXISTS "ChannelMessage_sessionId_createdAt_idx" ON "ChannelMessage"("sessionId", "createdAt" DESC);

-- AddForeignKey: TenantProfile -> Tenant
ALTER TABLE "TenantProfile" ADD CONSTRAINT "TenantProfile_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ChannelSession -> Tenant
ALTER TABLE "ChannelSession" ADD CONSTRAINT "ChannelSession_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ChannelMessage -> ChannelSession
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_sessionId_fkey" 
    FOREIGN KEY ("sessionId") REFERENCES "ChannelSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

