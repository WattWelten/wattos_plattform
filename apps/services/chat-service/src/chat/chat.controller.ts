import { Controller, Post, Get, Body, Param, Query, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { StreamingService } from '../streaming/streaming.service';
import { Observable } from 'rxjs';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly streamingService: StreamingService,
  ) {}

  @Post()
  async createChat(@Body() dto: CreateChatDto) {
    return this.chatService.createChat(dto.userId, dto.tenantId, dto.title);
  }

  @Get(':chatId')
  async getChat(@Param('chatId') chatId: string) {
    return this.chatService.getChat(chatId);
  }

  @Get('user/:userId')
  async listChats(
    @Param('userId') userId: string,
    @Query('tenantId') tenantId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.chatService.listChats(userId, tenantId, limit, offset);
  }

  @Post(':chatId/message')
  async sendMessage(@Param('chatId') chatId: string, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage({
      ...dto,
      chatId,
    });
  }

  @Sse(':chatId/stream')
  streamMessage(@Param('chatId') chatId: string, @Body() dto: SendMessageDto): Observable<any> {
    return this.streamingService.streamChatMessage(chatId, dto);
  }
}


