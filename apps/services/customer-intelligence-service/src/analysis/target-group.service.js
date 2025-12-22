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
var TargetGroupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetGroupService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const db_1 = require("@wattweiser/db");
const rxjs_1 = require("rxjs");
const shared_1 = require("@wattweiser/shared");
let TargetGroupService = TargetGroupService_1 = class TargetGroupService {
    prisma;
    configService;
    httpService;
    serviceDiscovery;
    logger = new common_1.Logger(TargetGroupService_1.name);
    constructor(prisma, configService, httpService, serviceDiscovery) {
        this.prisma = prisma;
        this.configService = configService;
        this.httpService = httpService;
        this.serviceDiscovery = serviceDiscovery;
    }
    async identifyTargetGroups(analysisId, aggregatedData) {
        try {
            const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);
            const prompt = `Analysiere die folgenden Daten und identifiziere Zielgruppen:
      
Crawler-Daten: ${JSON.stringify(aggregatedData.crawler).substring(0, 2000)}
Dokumente: ${JSON.stringify(aggregatedData.documents).substring(0, 2000)}
Conversations: ${JSON.stringify(aggregatedData.conversations).substring(0, 2000)}

Erstelle eine Liste von Zielgruppen mit:
- name: Name der Zielgruppe
- description: Beschreibung
- demographics: { ageRange, gender, location }
- language: Hauptsprache (de, en, tr, etc.)
- behaviorPatterns: { interactions, preferences }
- contentPreferences: { preferredContentTypes }
- size: Geschätzte Größe
- confidence: Konfidenz-Score (0.0-1.0)

Antworte als JSON-Array.`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
                model: 'gpt-4',
                provider: 'openai',
                messages: [
                    {
                        role: 'system',
                        content: 'Du bist ein Experte für Zielgruppen-Analyse. Antworte nur mit gültigem JSON.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 2000,
            }));
            const content = response.data.choices[0]?.message?.content || '[]';
            let targetGroups;
            try {
                const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                targetGroups = JSON.parse(cleanedContent);
                if (!Array.isArray(targetGroups)) {
                    this.logger.warn('LLM response is not an array, wrapping in array');
                    targetGroups = [targetGroups];
                }
            }
            catch (parseError) {
                this.logger.error(`Failed to parse LLM response: ${parseError.message}`);
                this.logger.debug(`Response content: ${content.substring(0, 500)}`);
                targetGroups = [];
            }
            const createdTargetGroups = [];
            for (const tg of targetGroups) {
                const created = await this.prisma.targetGroup.create({
                    data: {
                        analysisId,
                        name: tg.name,
                        description: tg.description,
                        demographics: tg.demographics || {},
                        behaviorPatterns: tg.behaviorPatterns || {},
                        language: tg.language || 'de',
                        contentPreferences: tg.contentPreferences || {},
                        size: tg.size,
                        confidence: tg.confidence || 0.5,
                    },
                });
                createdTargetGroups.push(created);
            }
            this.logger.log(`Identified ${createdTargetGroups.length} target groups for analysis ${analysisId}`);
            return createdTargetGroups;
        }
        catch (error) {
            this.logger.error(`Failed to identify target groups: ${error.message}`);
            throw error;
        }
    }
    async analyzeDemographics(data) {
        return {
            ageRange: { min: 18, max: 65 },
            gender: { male: 0.5, female: 0.5 },
            location: 'de',
        };
    }
    async analyzeBehaviorPatterns(data) {
        return {
            interactions: [],
            preferences: [],
        };
    }
    async detectLanguages(data) {
        const languages = new Set();
        for (const item of data) {
            if (item.content || item.text) {
                const text = (item.content || item.text).toLowerCase();
                if (text.includes('der ') || text.includes('die ') || text.includes('das ')) {
                    languages.add('de');
                }
                if (text.includes('the ') || text.includes('and ') || text.includes('is ')) {
                    languages.add('en');
                }
                if (text.includes('ve ') || text.includes('bir ') || text.includes('ile ')) {
                    languages.add('tr');
                }
            }
        }
        return Array.from(languages).length > 0 ? Array.from(languages) : ['de'];
    }
};
exports.TargetGroupService = TargetGroupService;
exports.TargetGroupService = TargetGroupService = TargetGroupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_1.PrismaService,
        config_1.ConfigService,
        axios_1.HttpService,
        shared_1.ServiceDiscoveryService])
], TargetGroupService);
//# sourceMappingURL=target-group.service.js.map