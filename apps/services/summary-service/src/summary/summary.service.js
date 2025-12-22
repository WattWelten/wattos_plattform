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
var SummaryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const shared_1 = require("@wattweiser/shared");
let SummaryService = SummaryService_1 = class SummaryService {
    configService;
    httpService;
    serviceDiscovery;
    logger = new common_1.Logger(SummaryService_1.name);
    constructor(configService, httpService, serviceDiscovery) {
        this.configService = configService;
        this.httpService = httpService;
        this.serviceDiscovery = serviceDiscovery;
    }
    async createSummary(dto) {
        try {
            const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);
            const systemPrompt = `Du bist ein Experte für Textzusammenfassungen. Erstelle eine präzise, strukturierte Zusammenfassung des folgenden Textes. 
      
Wichtige Anforderungen:
- Fasse die wichtigsten Punkte zusammen
- Behalte die Kernaussagen bei
- Verwende eine klare, professionelle Sprache
- Strukturiere die Zusammenfassung mit Überschriften, wenn sinnvoll
- Maximale Länge: ${dto.maxLength || 500} Zeichen`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
                model: dto.model || 'gpt-4',
                provider: dto.provider || 'openai',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: dto.content,
                    },
                ],
                temperature: 0.3,
                max_tokens: dto.maxLength || 500,
            }));
            const summary = response.data.choices[0]?.message?.content || '';
            return {
                summary,
                originalLength: dto.content.length,
                summaryLength: summary.length,
                compressionRatio: (summary.length / dto.content.length) * 100,
                model: dto.model || 'gpt-4',
                provider: dto.provider || 'openai',
            };
        }
        catch (error) {
            this.logger.error(`Summary creation failed: ${error.message}`);
            throw error;
        }
    }
    async summarizeChat(chatId, maxLength) {
        const chatContent = 'Chat content placeholder';
        return this.createSummary({
            content: chatContent,
            maxLength: maxLength || 500,
        });
    }
    async summarizeDocument(documentId, maxLength) {
        const documentContent = 'Document content placeholder';
        return this.createSummary({
            content: documentContent,
            maxLength: maxLength || 1000,
        });
    }
};
exports.SummaryService = SummaryService;
exports.SummaryService = SummaryService = SummaryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        shared_1.ServiceDiscoveryService])
], SummaryService);
//# sourceMappingURL=summary.service.js.map