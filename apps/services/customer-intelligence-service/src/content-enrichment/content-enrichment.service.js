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
var ContentEnrichmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentEnrichmentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const db_1 = require("@wattweiser/db");
const rxjs_1 = require("rxjs");
const shared_1 = require("@wattweiser/shared");
let ContentEnrichmentService = ContentEnrichmentService_1 = class ContentEnrichmentService {
    prisma;
    configService;
    httpService;
    serviceDiscovery;
    logger = new common_1.Logger(ContentEnrichmentService_1.name);
    constructor(prisma, configService, httpService, serviceDiscovery) {
        this.prisma = prisma;
        this.configService = configService;
        this.httpService = httpService;
        this.serviceDiscovery = serviceDiscovery;
    }
    async enrichContent(dto) {
        try {
            const targetGroup = await this.prisma.targetGroup.findUnique({
                where: { id: dto.targetGroupId },
            });
            if (!targetGroup) {
                throw new common_1.NotFoundException(`Target group ${dto.targetGroupId} not found`);
            }
            const relevanceScore = dto.relevanceScore ?? (await this.calculateRelevanceScore(dto.content, targetGroup));
            const language = dto.language ?? (await this.detectLanguage(dto.content));
            const enrichment = await this.prisma.contentEnrichment.create({
                data: {
                    targetGroupId: dto.targetGroupId,
                    sourceType: dto.sourceType,
                    sourceId: dto.sourceId,
                    content: dto.content,
                    relevanceScore,
                    language,
                    metadata: {},
                },
            });
            this.logger.log(`Content enriched for target group ${dto.targetGroupId} with score ${relevanceScore}`);
            return enrichment;
        }
        catch (error) {
            this.logger.error(`Failed to enrich content: ${error.message}`);
            throw error;
        }
    }
    async calculateRelevanceScore(content, targetGroup) {
        try {
            const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);
            const prompt = `Bewerte die Relevanz des folgenden Contents für die Zielgruppe:

Content: ${content.substring(0, 2000)}

Zielgruppe: ${targetGroup.name}
Beschreibung: ${targetGroup.description}
Demografie: ${JSON.stringify(targetGroup.demographics)}
Verhaltensmuster: ${JSON.stringify(targetGroup.behaviorPatterns)}
Content-Präferenzen: ${JSON.stringify(targetGroup.contentPreferences)}

Bewerte die Relevanz auf einer Skala von 0.0 bis 1.0, wobei:
- 1.0 = Sehr relevant, perfekt auf Zielgruppe zugeschnitten
- 0.5 = Teilweise relevant
- 0.0 = Nicht relevant

Antworte nur mit einer Zahl zwischen 0.0 und 1.0.`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
                model: 'gpt-4',
                provider: 'openai',
                messages: [
                    {
                        role: 'system',
                        content: 'Du bist ein Experte für Content-Relevanz-Bewertung. Antworte nur mit einer Zahl.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3,
                max_tokens: 10,
            }));
            const score = parseFloat(response.data.choices[0]?.message?.content || '0.5');
            return Math.max(0.0, Math.min(1.0, score));
        }
        catch (error) {
            this.logger.warn(`Failed to calculate relevance score: ${error.message}`);
            return 0.5;
        }
    }
    async detectLanguage(content) {
        const text = content.toLowerCase();
        if (text.includes('der ') || text.includes('die ') || text.includes('das ')) {
            return 'de';
        }
        if (text.includes('the ') || text.includes('and ') || text.includes('is ')) {
            return 'en';
        }
        if (text.includes('ve ') || text.includes('bir ') || text.includes('ile ')) {
            return 'tr';
        }
        return 'de';
    }
    async mapToTargetGroup(content, analysisId) {
        try {
            const targetGroups = await this.prisma.targetGroup.findMany({
                where: { analysisId },
            });
            if (targetGroups.length === 0) {
                return null;
            }
            const scores = await Promise.all(targetGroups.map(async (tg) => ({
                targetGroupId: tg.id,
                score: await this.calculateRelevanceScore(content, tg),
            })));
            const bestMatch = scores.reduce((prev, current) => current.score > prev.score ? current : prev);
            return bestMatch.score > 0.5 ? bestMatch.targetGroupId : null;
        }
        catch (error) {
            this.logger.error(`Failed to map content to target group: ${error.message}`);
            return null;
        }
    }
    async getEnrichedContent(targetGroupId, minRelevanceScore = 0.5) {
        return this.prisma.contentEnrichment.findMany({
            where: {
                targetGroupId,
                relevanceScore: {
                    gte: minRelevanceScore,
                },
            },
            orderBy: {
                relevanceScore: 'desc',
            },
        });
    }
};
exports.ContentEnrichmentService = ContentEnrichmentService;
exports.ContentEnrichmentService = ContentEnrichmentService = ContentEnrichmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_1.PrismaService,
        config_1.ConfigService,
        axios_1.HttpService,
        shared_1.ServiceDiscoveryService])
], ContentEnrichmentService);
//# sourceMappingURL=content-enrichment.service.js.map