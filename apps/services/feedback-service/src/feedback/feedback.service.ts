import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

/**
 * Feedback Service
 * Verwaltet User-Feedback für Chats, Agenten, etc.
 */
@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Feedback erstellen
   */
  async createFeedback(dto: CreateFeedbackDto) {
    try {
      if (!dto.userId) {
        throw new Error('UserId is required');
      }

      // Feedback in DB speichern
      const feedback = await this.prismaService.client.feedback.create({
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
    } catch (error: any) {
      this.logger.error(`Feedback creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Feedback für Chat abrufen
   */
  async getChatFeedback(chatId: string) {
    try {
      const feedbacks = await this.prismaService.client.feedback.findMany({
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

      const ratings = feedbacks.filter((f) => f.rating !== null).map((f) => f.rating!);
      const averageRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      return {
        chatId,
        averageRating: Math.round(averageRating * 10) / 10,
        totalFeedback: feedbacks.length,
        feedback: feedbacks,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get chat feedback: ${error.message}`);
      throw error;
    }
  }

  /**
   * Feedback für Agent abrufen
   */
  async getAgentFeedback(agentId: string) {
    try {
      const feedbacks = await this.prismaService.client.feedback.findMany({
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

      const ratings = feedbacks.filter((f) => f.rating !== null).map((f) => f.rating!);
      const averageRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      return {
        agentId,
        averageRating: Math.round(averageRating * 10) / 10,
        totalFeedback: feedbacks.length,
        feedback: feedbacks,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get agent feedback: ${error.message}`);
      throw error;
    }
  }

  /**
   * Feedback-Statistiken
   */
  async getFeedbackStats(tenantId: string) {
    try {
      const allFeedback = await this.prismaService.client.feedback.findMany({
        where: {
          metadata: {
            path: ['tenantId'],
            equals: tenantId,
          },
        },
      });

      const chatFeedback = allFeedback.filter((f) => f.type === 'chat');
      const agentFeedback = allFeedback.filter((f) => f.type === 'agent');

      const calculateAverage = (feedbacks: any[]) => {
        const ratings = feedbacks.filter((f) => f.rating !== null).map((f) => f.rating!);
        return ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : 0;
      };

      const allRatings = allFeedback.filter((f) => f.rating !== null).map((f) => f.rating!);
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
    } catch (error: any) {
      this.logger.error(`Failed to get feedback stats: ${error.message}`);
      throw error;
    }
  }
}

