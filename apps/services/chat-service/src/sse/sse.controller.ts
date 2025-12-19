import { Controller, Post, Param, Body, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { Observable, interval, map } from 'rxjs';
import { ChatService } from '../chat/chat.service';
import { StreamingService } from '../streaming/streaming.service';
import { SendMessageDto } from '../chat/dto/send-message.dto';

/**
 * SSE Controller
 * Handles Server-Sent Events für Chat-Streaming
 */
@Controller('sse')
export class SseController {
  constructor(
    private readonly chatService: ChatService,
    private readonly streamingService: StreamingService,
  ) {}

  @Sse(':chatId/stream')
  stream(@Param('chatId') chatId: string, @Body() dto: SendMessageDto): Observable<any> {
    return this.streamingService.streamChatMessage(chatId, dto);
  }

  @Post(':chatId/message')
  async sendMessage(@Param('chatId') chatId: string, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage({
      ...dto,
      chatId,
    });
  }
}


