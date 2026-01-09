import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '@wattweiser/db';
import { Request } from 'express';

interface FeedbackDto {
  messageId?: string;
  conversationId?: string;
  rating: 'positive' | 'negative';
  reason?: string;
  comment?: string;
}

@ApiBearerAuth()
@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Submit feedback for a message or conversation' })
  async submitFeedback(@Body() feedback: FeedbackDto, @Req() req: Request) {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Find the message or conversation
    let messageId: string | undefined;
    let conversationId: string | undefined;

    if (feedback.messageId) {
      messageId = feedback.messageId;
      const message = await (this.prisma.client as any).message.findFirst({
        where: { id: messageId, chat: { userId } },
        select: { chatId: true },
      });
      if (message) {
        conversationId = message.chatId;
      }
    } else if (feedback.conversationId) {
      conversationId = feedback.conversationId;
    }

    // Create feedback
    const created = await (this.prisma.client as any).feedback.create({
      data: {
        userId,
        type: 'rating',
        rating: feedback.rating === 'positive' ? 5 : 1,
        content: feedback.comment || feedback.reason || undefined,
        metadata: {
          messageId,
          conversationId,
          reason: feedback.reason,
        },
      },
    });

    return {
      id: created.id,
      message: 'Feedback submitted successfully',
    };
  }
}
