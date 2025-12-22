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
var MetricsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@wattweiser/db");
let MetricsService = MetricsService_1 = class MetricsService {
    logger = new common_1.Logger(MetricsService_1.name);
    prisma;
    constructor() {
        this.prisma = new db_1.PrismaClient();
    }
    async getDashboardMetrics(tenantId) {
        const [users, chats, agentRuns, llmUsage] = await Promise.all([
            this.prisma.user.count({ where: { tenantId } }),
            this.prisma.chat.count({ where: { tenantId } }),
            this.prisma.agentRun.count({
                where: {
                    agent: { tenantId },
                },
            }),
            this.prisma.lLMUsage.findMany({
                where: { tenantId },
                select: {
                    costUsd: true,
                    totalTokens: true,
                    provider: true,
                },
            }),
        ]);
        const totalCost = llmUsage.reduce((sum, usage) => sum + Number(usage.costUsd), 0);
        const totalTokens = llmUsage.reduce((sum, usage) => sum + usage.totalTokens, 0);
        const usageByProvider = llmUsage.reduce((acc, usage) => {
            const provider = usage.provider;
            if (!acc[provider]) {
                acc[provider] = { cost: 0, tokens: 0 };
            }
            acc[provider].cost += Number(usage.costUsd);
            acc[provider].tokens += usage.totalTokens;
            return acc;
        }, {});
        return {
            users,
            chats,
            agentRuns,
            llmUsage: {
                totalCost,
                totalTokens,
                usageByProvider,
            },
        };
    }
    async getLLMUsageMetrics(tenantId, startDate, endDate) {
        const where = { tenantId };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = startDate;
            }
            if (endDate) {
                where.createdAt.lte = endDate;
            }
        }
        const usage = await this.prisma.lLMUsage.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        const totalCost = usage.reduce((sum, u) => sum + Number(u.costUsd), 0);
        const totalTokens = usage.reduce((sum, u) => sum + u.totalTokens, 0);
        const byProvider = usage.reduce((acc, u) => {
            if (!acc[u.provider]) {
                acc[u.provider] = { cost: 0, tokens: 0, count: 0 };
            }
            acc[u.provider].cost += Number(u.costUsd);
            acc[u.provider].tokens += u.totalTokens;
            acc[u.provider].count += 1;
            return acc;
        }, {});
        const byModel = usage.reduce((acc, u) => {
            if (!acc[u.model]) {
                acc[u.model] = { cost: 0, tokens: 0, count: 0 };
            }
            acc[u.model].cost += Number(u.costUsd);
            acc[u.model].tokens += u.totalTokens;
            acc[u.model].count += 1;
            return acc;
        }, {});
        return {
            totalCost,
            totalTokens,
            totalRequests: usage.length,
            byProvider,
            byModel,
        };
    }
    async getAgentPerformanceMetrics(tenantId, agentId) {
        const where = {
            agent: { tenantId },
        };
        if (agentId) {
            where.agentId = agentId;
        }
        const runs = await this.prisma.agentRun.findMany({
            where,
            include: {
                agent: true,
            },
        });
        const completed = runs.filter((r) => r.status === 'completed');
        const failed = runs.filter((r) => r.status === 'failed');
        const avgDuration = completed.length > 0
            ? completed.reduce((sum, r) => {
                const metrics = r.metrics;
                return sum + (metrics.duration || 0);
            }, 0) / completed.length
            : 0;
        const byAgent = runs.reduce((acc, r) => {
            if (!acc[r.agentId]) {
                acc[r.agentId] = {
                    total: 0,
                    completed: 0,
                    failed: 0,
                    avgDuration: 0,
                };
            }
            acc[r.agentId].total += 1;
            if (r.status === 'completed') {
                acc[r.agentId].completed += 1;
                const metrics = r.metrics;
                acc[r.agentId].avgDuration += metrics.duration || 0;
            }
            if (r.status === 'failed') {
                acc[r.agentId].failed += 1;
            }
            return acc;
        }, {});
        Object.keys(byAgent).forEach((id) => {
            if (byAgent[id].completed > 0) {
                byAgent[id].avgDuration = byAgent[id].avgDuration / byAgent[id].completed;
            }
        });
        return {
            total: runs.length,
            completed: completed.length,
            failed: failed.length,
            successRate: runs.length > 0 ? completed.length / runs.length : 0,
            avgDuration,
            byAgent,
        };
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = MetricsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map