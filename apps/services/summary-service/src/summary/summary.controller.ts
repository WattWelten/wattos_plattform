import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { CreateSummaryDto } from './dto/create-summary.dto';

@Controller('summary')
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @Post()
  async createSummary(@Body() dto: CreateSummaryDto) {
    return this.summaryService.createSummary(dto);
  }

  @Get('chat/:chatId')
  async summarizeChat(@Param('chatId') chatId: string) {
    return this.summaryService.summarizeChat(chatId);
  }

  @Get('document/:documentId')
  async summarizeDocument(@Param('documentId') documentId: string) {
    return this.summaryService.summarizeDocument(documentId);
  }
}


