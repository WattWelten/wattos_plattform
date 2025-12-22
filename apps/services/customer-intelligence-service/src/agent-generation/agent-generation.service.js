"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentGenerationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentGenerationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const db_1 = require("@wattweiser/db");
const rxjs_1 = require("rxjs");
const shared_1 = require("@wattweiser/shared");
let AgentGenerationService = AgentGenerationService_1 = class AgentGenerationService {
    prisma;
    configService;
    httpService;
    serviceDiscovery;
    logger = new common_1.Logger(AgentGenerationService_1.name);
    constructor(prisma, configService, httpService, serviceDiscovery) {
        this.prisma = prisma;
        this.configService = configService;
        this.httpService = httpService;
        this.serviceDiscovery = serviceDiscovery;
    }
    async generateAgents(dto) {
        try {
            const analysis = await this.prisma.customerAnalysis.findUnique({
                where: { id: dto.analysisId },
                include: {
                    personas: dto.personaIds
                        ? {
                            where: { id: { in: dto.personaIds } },
                        }
                        : true,
                    targetGroups: dto.targetGroupIds
                        ? {
                            where: { id: { in: dto.targetGroupIds } },
                        }
                        : true,
                },
            });
            if (!analysis) {
                throw new common_1.NotFoundException(`Analysis ${dto.analysisId} not found`);
            }
            const agentGenerations = [];
            for (const persona of analysis.personas) {
                const generation = await this.generateAgentForPersona(dto.analysisId, persona.id, persona.targetGroupId, persona);
                agentGenerations.push(generation);
            }
            this.logger.log(`Generated ${agentGenerations.length} agents for analysis ${dto.analysisId}`);
            return agentGenerations;
        }
        catch (error) {
            this.logger.error(`Failed to generate agents: ${error.message}`);
            throw error;
        }
    }
    async generateAgentForPersona(analysisId, personaId, targetGroupId, persona) {
        try {
            const generation = await this.prisma.agentGeneration.create({
                data: {
                    analysisId,
                    personaId,
                    targetGroupId,
                    status: 'generating',
                    generationConfig: {},
                },
            });
            try {
                const systemPrompt = await this.generateSystemPrompt(persona);
                const tools = this.selectTools(persona);
                const knowledgeBase = await this.linkKnowledgeBase(analysisId);
                let enhancedSystemPrompt = systemPrompt;
                if (knowledgeBase.knowledgeSpaceId) {
                    enhancedSystemPrompt = `${systemPrompt}\n\nVerwende den Knowledge Space "${knowledgeBase.name}" für deine Antworten.`;
                }
                const analysis = await this.prisma.customerAnalysis.findUnique({
                    where: { id: analysisId },
                    select: { tenantId: true },
                });
                if (!analysis) {
                    throw new common_1.NotFoundException(`Analysis ${analysisId} not found`);
                }
                const agent = await this.prisma.agent.create({
                    data: {
                        tenantId: analysis.tenantId,
                        name: `${persona.name} - Agent`,
                        roleType: this.mapPersonaToRoleType(persona),
                        personaConfig: {
                            name: persona.name,
                            description: persona.description,
                            characteristics: persona.characteristics,
                            painPoints: persona.painPoints,
                            goals: persona.goals,
                            communicationStyle: persona.communicationStyle,
                            language: persona.language,
                        },
                        toolsConfig: tools,
                        policiesConfig: {
                            language: persona.language,
                            targetGroup: targetGroupId,
                        },
                        kpiConfig: {},
                    },
                });
                const agentId = agent.id;
                await this.prisma.agentGeneration.update({
                    where: { id: generation.id },
                    data: {
                        agentId,
                        status: 'completed',
                        completedAt: new Date(),
                        generationConfig: {
                            systemPrompt: enhancedSystemPrompt,
                            tools,
                            knowledgeBase,
                        },
                    },
                });
                this.logger.log(`Agent ${agentId} generated for persona ${personaId}`);
                return { ...generation, agentId, status: 'completed' };
            }
            catch (error) {
                await this.prisma.agentGeneration.update({
                    where: { id: generation.id },
                    data: {
                        status: 'failed',
                        error: error.message,
                    },
                });
                throw error;
            }
        }
        catch (error) {
            this.logger.error(`Failed to generate agent for persona ${personaId}: ${error.message}`);
            throw error;
        }
    }
    async generateSystemPrompt(persona) {
        const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);
        const prompt = `Erstelle einen System-Prompt für einen KI-Agenten, der für die folgende Persona entwickelt wurde:

Persona: ${persona.name}
Beschreibung: ${persona.description}
Charakteristika: ${JSON.stringify(persona.characteristics)}
Pain Points: ${JSON.stringify(persona.painPoints)}
Goals: ${JSON.stringify(persona.goals)}
Kommunikationsstil: ${JSON.stringify(persona.communicationStyle)}
Sprache: ${persona.language}

Der System-Prompt sollte:
- Die Rolle des Agenten klar definieren
- Den Kommunikationsstil widerspiegeln
- Auf die Pain Points und Goals eingehen
- In der Zielsprache (${persona.language}) formuliert sein
- Empathisch und hilfreich sein

Antworte nur mit dem System-Prompt-Text.`;
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
            model: 'gpt-4',
            provider: 'openai',
            messages: [
                {
                    role: 'system',
                    content: 'Du bist ein Experte für System-Prompt-Erstellung. Antworte nur mit dem Prompt-Text.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        }));
        return response.data.choices[0]?.message?.content || '';
    }
    selectTools(persona) {
        const tools = ['retrieval'];
        const painPoints = persona.painPoints || [];
        const goals = persona.goals || [];
        if (painPoints.some((p) => p.toLowerCase().includes('email'))) {
            tools.push('email');
        }
        if (painPoints.some((p) => p.toLowerCase().includes('calendar'))) {
            tools.push('calendar');
        }
        if (goals.some((g) => g.toLowerCase().includes('ticket'))) {
            tools.push('jira');
        }
        return tools;
    }
    async linkKnowledgeBase(analysisId) {
        try {
            const analysis = await this.prisma.customerAnalysis.findUnique({
                where: { id: analysisId },
                include: {
                    tenant: {
                        include: {
                            knowledgeSpaces: {
                                take: 1,
                                orderBy: { createdAt: 'desc' },
                            },
                        },
                    },
                },
            });
            if (analysis?.tenant?.knowledgeSpaces && analysis.tenant.knowledgeSpaces.length > 0) {
                const knowledgeSpace = analysis.tenant.knowledgeSpaces[0];
                return {
                    knowledgeSpaceId: knowledgeSpace.id,
                    name: knowledgeSpace.name,
                    description: knowledgeSpace.description,
                };
            }
            this.logger.warn(`No knowledge space found for analysis ${analysisId}`);
            return {
                knowledgeSpaceId: null,
                name: 'Default Knowledge Space',
            };
        }
        catch (error) {
            this.logger.error(`Failed to link knowledge base: ${error.message}`);
            return {
                knowledgeSpaceId: null,
                name: 'Default Knowledge Space',
            };
        }
    }
    mapPersonaToRoleType(persona) {
        const name = persona.name.toLowerCase();
        const goals = (persona.goals || []).join(' ').toLowerCase();
        if (name.includes('support') || goals.includes('support')) {
            return 'it-support-assist';
        }
        if (name.includes('sales') || goals.includes('sales')) {
            return 'sales-assist';
        }
        if (name.includes('marketing') || goals.includes('marketing')) {
            return 'marketing-assist';
        }
        return 'chatbot';
    }
    async getGeneration(id) {
        const generation = await this.prisma.agentGeneration.findUnique({
            where: { id },
            include: {
                analysis: true,
                persona: true,
                targetGroup: true,
                agent: true,
            },
        });
        if (!generation) {
            throw new common_1.NotFoundException(`Generation ${id} not found`);
        }
        return generation;
    }
};
exports.AgentGenerationService = AgentGenerationService;
exports.AgentGenerationService = AgentGenerationService = AgentGenerationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_1.PrismaService,
        config_1.ConfigService,
        axios_1.HttpService,
        shared_1.ServiceDiscoveryService])
], AgentGenerationService);
//# sourceMappingURL=agent-generation.service.js.map