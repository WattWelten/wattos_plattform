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
var AnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@wattweiser/db");
const data_aggregation_service_1 = require("./data-aggregation.service");
const target_group_service_1 = require("./target-group.service");
const personas_service_1 = require("../personas/personas.service");
let AnalysisService = AnalysisService_1 = class AnalysisService {
    prisma;
    dataAggregationService;
    targetGroupService;
    personasService;
    logger = new common_1.Logger(AnalysisService_1.name);
    constructor(prisma, dataAggregationService, targetGroupService, personasService) {
        this.prisma = prisma;
        this.dataAggregationService = dataAggregationService;
        this.targetGroupService = targetGroupService;
        this.personasService = personasService;
    }
    async createAnalysis(tenantId, dto) {
        try {
            const analysis = await this.prisma.customerAnalysis.create({
                data: {
                    tenantId,
                    customerType: dto.customerType,
                    analysisType: dto.analysisType || 'initial',
                    status: 'running',
                    metadata: dto.metadata || {},
                },
            });
            this.logger.log(`Analysis ${analysis.id} started for tenant ${tenantId}`);
            this.runAnalysis(analysis.id, tenantId, dto).catch((error) => {
                this.logger.error(`Analysis ${analysis.id} failed: ${error.message}`);
                this.prisma.customerAnalysis.update({
                    where: { id: analysis.id },
                    data: { status: 'failed', metadata: { error: error.message } },
                });
            });
            return analysis;
        }
        catch (error) {
            this.logger.error(`Failed to create analysis: ${error.message}`);
            throw error;
        }
    }
    async runAnalysis(analysisId, tenantId, dto) {
        try {
            const aggregatedData = await this.dataAggregationService.aggregateAllData(tenantId, dto.dataSources);
            const targetGroups = await this.targetGroupService.identifyTargetGroups(analysisId, aggregatedData);
            let personasCount = 0;
            if (targetGroups.length > 0) {
                try {
                    const personas = await this.personasService.generatePersonas(analysisId);
                    personasCount = personas.length;
                    this.logger.log(`Generated ${personasCount} personas for analysis ${analysisId}`);
                }
                catch (error) {
                    this.logger.warn(`Persona generation failed (non-critical): ${error.message}`);
                }
            }
            await this.prisma.customerAnalysis.update({
                where: { id: analysisId },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    metadata: {
                        targetGroupsCount: targetGroups.length,
                        personasCount,
                        dataSources: dto.dataSources,
                    },
                },
            });
            this.logger.log(`Analysis ${analysisId} completed with ${targetGroups.length} target groups`);
        }
        catch (error) {
            this.logger.error(`Analysis ${analysisId} failed: ${error.message}`);
            await this.prisma.customerAnalysis.update({
                where: { id: analysisId },
                data: { status: 'failed', metadata: { error: error.message } },
            });
            throw error;
        }
    }
    async getAnalysis(id) {
        const analysis = await this.prisma.customerAnalysis.findUnique({
            where: { id },
            include: {
                targetGroups: true,
                personas: true,
                agentGenerations: true,
            },
        });
        if (!analysis) {
            throw new common_1.NotFoundException(`Analysis ${id} not found`);
        }
        return analysis;
    }
    async getAnalysisReport(id) {
        const analysis = await this.getAnalysis(id);
        return {
            ...analysis,
            summary: {
                targetGroupsCount: analysis.targetGroups.length,
                personasCount: analysis.personas.length,
                agentGenerationsCount: analysis.agentGenerations.length,
                status: analysis.status,
            },
        };
    }
};
exports.AnalysisService = AnalysisService;
exports.AnalysisService = AnalysisService = AnalysisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_1.PrismaService,
        data_aggregation_service_1.DataAggregationService,
        target_group_service_1.TargetGroupService,
        personas_service_1.PersonasService])
], AnalysisService);
//# sourceMappingURL=analysis.service.js.map