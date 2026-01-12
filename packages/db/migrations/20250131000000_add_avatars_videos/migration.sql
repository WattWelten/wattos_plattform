-- CreateTable
CREATE TABLE "Avatar" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "characterId" TEXT,
    "name" TEXT NOT NULL,
    "glbUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'avaturn',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avatar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "avatarId" TEXT NOT NULL,
    "agentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "duration" INTEGER NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'webm',
    "resolution" TEXT NOT NULL DEFAULT '1920x1080',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Avatar_tenantId_idx" ON "Avatar"("tenantId");

-- CreateIndex
CREATE INDEX "Avatar_characterId_idx" ON "Avatar"("characterId");

-- CreateIndex
CREATE INDEX "Video_tenantId_idx" ON "Video"("tenantId");

-- CreateIndex
CREATE INDEX "Video_avatarId_idx" ON "Video"("avatarId");

-- CreateIndex
CREATE INDEX "Video_agentId_idx" ON "Video"("agentId");

-- CreateIndex
CREATE INDEX "Video_status_idx" ON "Video"("status");

-- AddForeignKey
ALTER TABLE "Avatar" ADD CONSTRAINT "Avatar_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Avatar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
