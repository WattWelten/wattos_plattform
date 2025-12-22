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
var FeedbackService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@wattweiser/db");
let FeedbackService = FeedbackService_1 = class FeedbackService {
    logger = new common_1.Logger(FeedbackService_1.name);
    prisma;
    constructor() {
        this.prisma = new db_1.PrismaClient();
    }
    async createFeedback(dto) {
        try {
            if (!dto.userId) {
                throw new Error('UserId is required');
            }
            const feedback = await this.prisma.feedback.create({
                data: {
                    userId: dto.userId,
                    type: dto.type,
                    content: dto.comment,
                    rating: dto.rating,
                    metadata: {
                        resourceId: dto.resourceId,
                        resourceType: dto.type,
                        tenantId: dto.tenantId,
                    },
                },
            });
            this.logger.log(`Feedback created: ${feedback.id} - Type: ${dto.type} - Rating: ${dto.rating}`);
            return feedback;
        }
        catch (error) {
            this.logger.error(`Feedback creation failed: ${error.message}`);
            throw error;
        }
    }
    async getChatFeedback(chatId) {
        try {
            const feedbacks = await this.prisma.feedback.findMany({
                where: {
                    metadata: {
                        path: ['resourceId'],
                        equals: chatId,
                    },
                    type: 'chat',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            const ratings = feedbacks.filter((f) => f.rating !== null).map((f) => f.rating);
            const averageRating = ratings.length > 0
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                : 0;
            return {
                chatId,
                averageRating: Math.round(averageRating * 10) / 10,
                totalFeedback: feedbacks.length,
                feedback: feedbacks,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get chat feedback: ${error.message}`);
            throw error;
        }
    }
    async getAgentFeedback(agentId) {
        try {
            const feedbacks = await this.prisma.feedback.findMany({
                where: {
                    metadata: {
                        path: ['resourceId'],
                        equals: agentId,
                    },
                    type: 'agent',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            const ratings = feedbacks.filter((f) => f.rating !== null).map((f) => f.rating);
            const averageRating = ratings.length > 0
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                : 0;
            return {
                agentId,
                averageRating: Math.round(averageRating * 10) / 10,
                totalFeedback: feedbacks.length,
                feedback: feedbacks,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get agent feedback: ${error.message}`);
            throw error;
        }
    }
    async getFeedbackStats(tenantId) {
        try {
            const allFeedback = await this.prisma.feedback.findMany({
                where: {
                    metadata: {
                        path: ['tenantId'],
                        equals: tenantId,
                    },
                },
            });
            const chatFeedback = allFeedback.filter((f) => f.type === 'chat');
            const agentFeedback = allFeedback.filter((f) => f.type === 'agent');
            const calculateAverage = (feedbacks) => {
                const ratings = feedbacks.filter((f) => f.rating !== null).map((f) => f.rating);
                return ratings.length > 0
                    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
                    : 0;
            };
            const allRatings = allFeedback.filter((f) => f.rating !== null).map((f) => f.rating);
            const overallAverage = allRatings.length > 0
                ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
                : 0;
            return {
                totalFeedback: allFeedback.length,
                averageRating: overallAverage,
                byType: {
                    chat: {
                        count: chatFeedback.length,
                        average: calculateAverage(chatFeedback),
                    },
                    agent: {
                        count: agentFeedback.length,
                        average: calculateAverage(agentFeedback),
                    },
                },
            };
        }
        catch (error) {
            this.logger.error(`Failed to get feedback stats: ${error.message}`);
            throw error;
        }
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = FeedbackService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map