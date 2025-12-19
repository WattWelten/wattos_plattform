import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { WebChatService } from './web-chat.service';
import { ChannelRouterService } from '@wattweiser/core';
import { ChannelMessage, ChannelSessionConfig } from '@wattweiser/core';
import { Observable } from 'rxjs';

/**
 * Web-Chat Controller
 * 
 * REST/WebSocket Endpoints für Web-Chatbot
 */
@Controller('api/v1/web-chat')
export class WebChatController {
  constructor(
    private readonly webChatService: WebChatService,
    private readonly channelRouter: ChannelRouterService,
  ) {}

  /**
   * Session erstellen
   */
  @Post('sessions')
  async createSession(@Body() config: ChannelSessionConfig) {
    return await this.channelRouter.createSession('web-chat', config);
  }

  /**
   * Session abrufen
   */
  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    const session = await this.webChatService.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session;
  }

  /**
   * Nachricht senden
   */
  @Post('sessions/:sessionId/messages')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() message: ChannelMessage,
  ) {
    return await this.channelRouter.sendMessage('web-chat', sessionId, message);
  }

  /**
   * Streaming (SSE)
   */
  @Sse('sessions/:sessionId/stream')
  streamMessage(
    @Param('sessionId') sessionId: string,
    @Body() message: ChannelMessage,
  ): Observable<any> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const stream = this.webChatService.streamMessage(sessionId, message);
          for await (const chunk of stream) {
            subscriber.next({
              data: JSON.stringify({
                type: 'chunk',
                content: chunk.message,
                metadata: chunk.metadata,
              }),
            });
          }
          subscriber.next({
            data: JSON.stringify({
              type: 'done',
            }),
          });
          subscriber.complete();
        } catch (error: any) {
          subscriber.error(error);
        }
      })();
    });
  }

  /**
   * Session schließen
   */
  @Post('sessions/:sessionId/close')
  async closeSession(@Param('sessionId') sessionId: string) {
    await this.channelRouter.closeSession('web-chat', sessionId);
    return { success: true };
  }
}

