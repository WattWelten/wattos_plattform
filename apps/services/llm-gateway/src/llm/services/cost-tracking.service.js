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
var CostTrackingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostTrackingService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@wattweiser/db");
const DEFAULT_RATES = {
    prompt: 0.000002,
    completion: 0.000004,
};
const MODEL_RATES = {
    'gpt-4': { prompt: 0.00003, completion: 0.00006 },
    'gpt-4-1106-preview': { prompt: 0.00001, completion: 0.00003 },
    'gpt-3.5-turbo': { prompt: 0.000001, completion: 0.000002 },
    'gpt-4-turbo': { prompt: 0.00001, completion: 0.00003 },
    'gpt-4o': { prompt: 0.000005, completion: 0.000015 },
    'claude-3-opus': { prompt: 0.000015, completion: 0.000075 },
    'claude-3-sonnet': { prompt: 0.000003, completion: 0.000015 },
    'claude-3-haiku': { prompt: 0.00000025, completion: 0.00000125 },
    'gemini-pro': { prompt: 0.0000005, completion: 0.0000015 },
};
let CostTrackingService = CostTrackingService_1 = class CostTrackingService {
    logger = new common_1.Logger(CostTrackingService_1.name);
    prisma;
    constructor() {
        this.prisma = new db_1.PrismaClient();
    }
    calculateCost(provider, model, usage) {
        const rates = MODEL_RATES[model] ?? DEFAULT_RATES;
        return (usage.prompt_tokens * rates.prompt + usage.completion_tokens * rates.completion) / 1000;
    }
    async recordUsage(input) {
        try {
            const costUsd = this.calculateCost(input.provider, input.model, input.usage);
            const logMessage = 'Cost | tenant=' +
                (input.tenantId ?? 'n/a') +
                ' provider=' +
                input.provider +
                ' model=' +
                input.model +
                ' cost=$' +
                costUsd.toFixed(6);
            this.logger.debug(logMessage);
            if (input.tenantId) {
                await this.prisma.lLMUsage.create({
                    data: {
                        tenantId: input.tenantId,
                        provider: input.provider,
                        model: input.model,
                        promptTokens: input.usage.prompt_tokens,
                        completionTokens: input.usage.completion_tokens,
                        totalTokens: input.usage.total_tokens,
                        costUsd: costUsd,
                    },
                });
                this.logger.log(`LLM usage recorded for tenant ${input.tenantId}`);
            }
            else {
                this.logger.warn('No tenantId provided, skipping database persistence');
            }
            return {
                ...input.usage,
                costUsd,
            };
        }
        catch (error) {
            this.logger.error(`Failed to record LLM usage: ${error.message}`);
            return {
                ...input.usage,
                costUsd: 0,
            };
        }
    }
    async getCostsForTenant(tenantId, startDate, endDate) {
        try {
            const where = { tenantId };
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = startDate;
                if (endDate)
                    where.createdAt.lte = endDate;
            }
            const usage = await this.prisma.lLMUsage.findMany({
                where,
                orderBy: { createdAt: 'desc' },
            });
            const totalCost = usage.reduce((sum, u) => sum + Number(u.costUsd), 0);
            const totalTokens = usage.reduce((sum, u) => sum + u.totalTokens, 0);
            return {
                totalCost,
                totalTokens,
                usageCount: usage.length,
                usage,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get costs for tenant: ${error.message}`);
            throw error;
        }
    }
};
exports.CostTrackingService = CostTrackingService;
exports.CostTrackingService = CostTrackingService = CostTrackingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CostTrackingService);
//# sourceMappingURL=cost-tracking.service.js.map