import { Controller, Post, Get, Body, Param, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendConversationMessageDto } from './dto/send-message.dto';
import { Observable } from 'rxjs';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async createConversation(@Body() dto: CreateConversationDto) {
    return this.conversationsService.createConversation(dto.role);
  }

  @Get(':threadId')
  async getConversation(@Param('threadId') threadId: string) {
    return this.conversationsService.getConversation(threadId);
  }

  @Post('message')
  async sendMessage(@Body() dto: SendConversationMessageDto) {
    return this.conversationsService.sendMessage(dto);
  }

  @Sse('message/stream')
  streamMessage(@Body() dto: SendConversationMessageDto): Observable<any> {
    return this.conversationsService.streamMessage(dto);
  }

  @Sse('message/audio/stream')
  streamAudioMessage(@Body() dto: SendConversationMessageDto): Observable<any> {
    // Audio-Streaming: Zuerst Text-Stream, dann TTS
    return new Observable((subscriber) => {
      const textStream = this.conversationsService.streamMessage(dto);
      
      textStream.subscribe({
        next: (data) => {
          if (data.type === 'done') {
            // TODO: TTS für vollständigen Text
            subscriber.next({
              type: 'audio_chunk',
              audio: '', // Placeholder für Audio-Daten
            });
          } else {
            subscriber.next(data);
          }
        },
        error: (error) => subscriber.error(error),
        complete: () => subscriber.complete(),
      });
    });
  }
}

