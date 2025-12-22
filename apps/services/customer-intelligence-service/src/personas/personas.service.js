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
var PersonasService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonasService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const db_1 = require("@wattweiser/db");
const rxjs_1 = require("rxjs");
const shared_1 = require("@wattweiser/shared");
let PersonasService = PersonasService_1 = class PersonasService {
    prisma;
    configService;
    httpService;
    serviceDiscovery;
    logger = new common_1.Logger(PersonasService_1.name);
    constructor(prisma, configService, httpService, serviceDiscovery) {
        this.prisma = prisma;
        this.configService = configService;
        this.httpService = httpService;
        this.serviceDiscovery = serviceDiscovery;
    }
    async generatePersonas(analysisId, targetGroupIds) {
        try {
            const analysis = await this.prisma.customerAnalysis.findUnique({
                where: { id: analysisId },
                include: {
                    targetGroups: targetGroupIds
                        ? {
                            where: { id: { in: targetGroupIds } },
                        }
                        : true,
                },
            });
            if (!analysis) {
                throw new common_1.NotFoundException(`Analysis ${analysisId} not found`);
            }
            const personas = [];
            for (const targetGroup of analysis.targetGroups) {
                const persona = await this.generatePersonaForTargetGroup(analysisId, targetGroup.id, targetGroup);
                personas.push(persona);
            }
            this.logger.log(`Generated ${personas.length} personas for analysis ${analysisId}`);
            return personas;
        }
        catch (error) {
            this.logger.error(`Failed to generate personas: ${error.message}`);
            throw error;
        }
    }
    async generatePersonaForTargetGroup(analysisId, targetGroupId, targetGroup) {
        try {
            const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);
            const prompt = `Erstelle eine detaillierte Persona basierend auf der folgenden Zielgruppe:

Zielgruppe: ${targetGroup.name}
Beschreibung: ${targetGroup.description}
Demografie: ${JSON.stringify(targetGroup.demographics)}
Verhaltensmuster: ${JSON.stringify(targetGroup.behaviorPatterns)}
Sprache: ${targetGroup.language}

Erstelle eine Persona mit:
- name: Name der Persona (z.B. "Maria, 35, junge Mutter")
- description: Detaillierte Beschreibung
- characteristics: { personality, needs, values }
- painPoints: Array von Herausforderungen
- goals: Array von Zielen
- communicationStyle: { tone, preferredChannels, language }

Antworte als JSON-Objekt.`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
                model: 'gpt-4',
                provider: 'openai',
                messages: [
                    {
                        role: 'system',
                        content: 'Du bist ein Experte für Persona-Entwicklung. Antworte nur mit gültigem JSON.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 2000,
            }));
            const content = response.data.choices[0]?.message?.content || '{}';
            let personaData;
            try {
                const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                personaData = JSON.parse(cleanedContent);
            }
            catch (parseError) {
                this.logger.error(`Failed to parse LLM response: ${parseError.message}`);
                this.logger.debug(`Response content: ${content.substring(0, 500)}`);
                personaData = {
                    name: targetGroup.name || 'Unnamed Persona',
                    description: targetGroup.description || '',
                    characteristics: {},
                    painPoints: [],
                    goals: [],
                    communicationStyle: {},
                };
            }
            const persona = await this.prisma.persona.create({
                data: {
                    analysisId,
                    targetGroupId,
                    name: personaData.name,
                    description: personaData.description,
                    characteristics: personaData.characteristics || {},
                    painPoints: personaData.painPoints || [],
                    goals: personaData.goals || [],
                    communicationStyle: personaData.communicationStyle || {},
                    language: targetGroup.language,
                },
            });
            return persona;
        }
        catch (error) {
            this.logger.error(`Failed to generate persona for target group ${targetGroupId}: ${error.message}`);
            throw error;
        }
    }
    async getPersona(id) {
        const persona = await this.prisma.persona.findUnique({
            where: { id },
            include: {
                analysis: true,
                targetGroup: true,
            },
        });
        if (!persona) {
            throw new common_1.NotFoundException(`Persona ${id} not found`);
        }
        return persona;
    }
    async getPersonasByAnalysis(analysisId) {
        return this.prisma.persona.findMany({
            where: { analysisId },
            include: {
                targetGroup: true,
            },
        });
    }
    async refinePersona(id, dto) {
        const persona = await this.prisma.persona.findUnique({
            where: { id },
        });
        if (!persona) {
            throw new common_1.NotFoundException(`Persona ${id} not found`);
        }
        return this.prisma.persona.update({
            where: { id },
            data: {
                name: dto.name ?? persona.name,
                description: dto.description ?? persona.description,
                characteristics: dto.characteristics ?? persona.characteristics,
                painPoints: dto.painPoints ?? persona.painPoints,
                goals: dto.goals ?? persona.goals,
                communicationStyle: dto.communicationStyle ?? persona.communicationStyle,
            },
        });
    }
};
exports.PersonasService = PersonasService;
exports.PersonasService = PersonasService = PersonasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_1.PrismaService,
        config_1.ConfigService,
        axios_1.HttpService,
        shared_1.ServiceDiscoveryService])
], PersonasService);
//# sourceMappingURL=personas.service.js.map