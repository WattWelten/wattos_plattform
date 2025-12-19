import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async createFeedback(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(dto);
  }

  @Get('chat/:chatId')
  async getChatFeedback(@Param('chatId') chatId: string) {
    return this.feedbackService.getChatFeedback(chatId);
  }

  @Get('agent/:agentId')
  async getAgentFeedback(@Param('agentId') agentId: string) {
    return this.feedbackService.getAgentFeedback(agentId);
  }

  @Get('stats')
  async getFeedbackStats(@Query('tenantId') tenantId: string) {
    return this.feedbackService.getFeedbackStats(tenantId);
  }
}


