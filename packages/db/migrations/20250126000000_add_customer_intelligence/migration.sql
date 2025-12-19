-- CreateTable
CREATE TABLE "CustomerAnalysis" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerType" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetGroup" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "demographics" JSONB NOT NULL DEFAULT '{}',
    "behaviorPatterns" JSONB NOT NULL DEFAULT '{}',
    "language" TEXT NOT NULL,
    "contentPreferences" JSONB NOT NULL DEFAULT '{}',
    "size" INTEGER,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TargetGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "targetGroupId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "characteristics" JSONB NOT NULL DEFAULT '{}',
    "painPoints" JSONB NOT NULL DEFAULT '[]',
    "goals" JSONB NOT NULL DEFAULT '[]',
    "communicationStyle" JSONB NOT NULL DEFAULT '{}',
    "language" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentEnrichment" (
    "id" TEXT NOT NULL,
    "targetGroupId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "language" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentEnrichment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentGeneration" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "personaId" TEXT,
    "targetGroupId" TEXT,
    "agentId" TEXT,
    "generationConfig" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AgentGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerAnalysis_tenantId_idx" ON "CustomerAnalysis"("tenantId");

-- CreateIndex
CREATE INDEX "CustomerAnalysis_status_idx" ON "CustomerAnalysis"("status");

-- CreateIndex
CREATE INDEX "CustomerAnalysis_customerType_idx" ON "CustomerAnalysis"("customerType");

-- CreateIndex
CREATE INDEX "TargetGroup_analysisId_idx" ON "TargetGroup"("analysisId");

-- CreateIndex
CREATE INDEX "TargetGroup_language_idx" ON "TargetGroup"("language");

-- CreateIndex
CREATE INDEX "TargetGroup_confidence_idx" ON "TargetGroup"("confidence");

-- CreateIndex
CREATE INDEX "Persona_analysisId_idx" ON "Persona"("analysisId");

-- CreateIndex
CREATE INDEX "Persona_targetGroupId_idx" ON "Persona"("targetGroupId");

-- CreateIndex
CREATE INDEX "Persona_language_idx" ON "Persona"("language");

-- CreateIndex
CREATE INDEX "ContentEnrichment_targetGroupId_idx" ON "ContentEnrichment"("targetGroupId");

-- CreateIndex
CREATE INDEX "ContentEnrichment_sourceType_sourceId_idx" ON "ContentEnrichment"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ContentEnrichment_relevanceScore_idx" ON "ContentEnrichment"("relevanceScore");

-- CreateIndex
CREATE INDEX "AgentGeneration_analysisId_idx" ON "AgentGeneration"("analysisId");

-- CreateIndex
CREATE INDEX "AgentGeneration_personaId_idx" ON "AgentGeneration"("personaId");

-- CreateIndex
CREATE INDEX "AgentGeneration_targetGroupId_idx" ON "AgentGeneration"("targetGroupId");

-- CreateIndex
CREATE INDEX "AgentGeneration_agentId_idx" ON "AgentGeneration"("agentId");

-- CreateIndex
CREATE INDEX "AgentGeneration_status_idx" ON "AgentGeneration"("status");

-- AddForeignKey
ALTER TABLE "CustomerAnalysis" ADD CONSTRAINT "CustomerAnalysis_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetGroup" ADD CONSTRAINT "TargetGroup_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CustomerAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CustomerAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_targetGroupId_fkey" FOREIGN KEY ("targetGroupId") REFERENCES "TargetGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentEnrichment" ADD CONSTRAINT "ContentEnrichment_targetGroupId_fkey" FOREIGN KEY ("targetGroupId") REFERENCES "TargetGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentGeneration" ADD CONSTRAINT "AgentGeneration_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CustomerAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentGeneration" ADD CONSTRAINT "AgentGeneration_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentGeneration" ADD CONSTRAINT "AgentGeneration_targetGroupId_fkey" FOREIGN KEY ("targetGroupId") REFERENCES "TargetGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentGeneration" ADD CONSTRAINT "AgentGeneration_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;














