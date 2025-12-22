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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const content_enrichment_service_1 = require("../content-enrichment/content-enrichment.service");
const db_1 = require("@wattweiser/db");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    contentEnrichmentService;
    prisma;
    logger = new common_1.Logger(WebhooksController_1.name);
    constructor(contentEnrichmentService, prisma) {
        this.contentEnrichmentService = contentEnrichmentService;
        this.prisma = prisma;
    }
    async handleCrawlerData(data) {
        this.logger.log(`Received crawler data webhook for URL: ${data.url}`);
        try {
            const { tenantId, url, title, content, language, metadata, crawledAt } = data;
            if (!tenantId || !url || !content) {
                return { received: false, error: 'Missing required fields: tenantId, url, content' };
            }
            const activeAnalyses = await this.prisma.customerAnalysis.findMany({
                where: {
                    tenantId,
                    status: { in: ['running', 'completed'] },
                },
                include: {
                    targetGroups: true,
                },
            });
            if (activeAnalyses && activeAnalyses.length > 0) {
                for (const analysis of activeAnalyses) {
                    for (const targetGroup of analysis.targetGroups) {
                        await this.contentEnrichmentService.enrichContent({
                            targetGroupId: targetGroup.id,
                            sourceType: 'crawler',
                            sourceId: url,
                            content: `${title}\n\n${content}`,
                            language: language || 'de',
                        });
                    }
                }
                this.logger.log(`Enriched content for ${activeAnalyses.length} analyses`);
            }
            return { received: true, processed: true, analysesUpdated: activeAnalyses?.length || 0 };
        }
        catch (error) {
            this.logger.error(`Failed to process crawler data: ${error.message}`);
            return { received: true, processed: false, error: error.message };
        }
    }
    async handleDocumentProcessed(data) {
        this.logger.log(`Received document processed webhook for document: ${data.document_id}`);
        try {
            const tenantId = data.tenantId || data.tenant_id;
            const { document_id, filename, knowledge_space_id, chunks_count, processed_at } = data;
            if (!tenantId || !document_id) {
                return { received: false, error: 'Missing required fields: tenantId (or tenant_id), document_id' };
            }
            const document = await this.prisma.document.findUnique({
                where: { id: document_id },
                include: {
                    knowledgeSpace: {
                        include: {
                            tenant: true,
                        },
                    },
                },
            });
            if (!document) {
                this.logger.warn(`Document ${document_id} not found in database`);
                return { received: true, processed: false, message: 'Document not found in database' };
            }
            const activeAnalyses = await this.prisma.customerAnalysis.findMany({
                where: {
                    tenantId: tenantId || document.knowledgeSpace.tenantId,
                    status: { in: ['running', 'completed'] },
                },
                include: {
                    targetGroups: true,
                },
            });
            if (activeAnalyses && activeAnalyses.length > 0) {
                const chunks = await this.prisma.chunk.findMany({
                    where: { documentId: document_id },
                    select: { content: true },
                    take: 10,
                });
                const documentContent = chunks.map((c) => c.content).join('\n\n');
                for (const analysis of activeAnalyses) {
                    for (const targetGroup of analysis.targetGroups) {
                        await this.contentEnrichmentService.enrichContent({
                            targetGroupId: targetGroup.id,
                            sourceType: 'document',
                            sourceId: document_id,
                            content: `${filename}\n\n${documentContent}`,
                            language: 'de',
                        });
                    }
                }
                this.logger.log(`Enriched content from document ${document_id} for ${activeAnalyses.length} analyses`);
            }
            return {
                received: true,
                processed: true,
                analysesUpdated: activeAnalyses?.length || 0,
                documentId: document_id,
            };
        }
        catch (error) {
            this.logger.error(`Failed to process document webhook: ${error.message}`);
            return { received: true, processed: false, error: error.message };
        }
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('crawler/data'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleCrawlerData", null);
__decorate([
    (0, common_1.Post)('ingestion/document-processed'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleDocumentProcessed", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [content_enrichment_service_1.ContentEnrichmentService,
        db_1.PrismaService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map