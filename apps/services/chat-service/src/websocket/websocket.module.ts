import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { ChatService } from '../chat/chat.service';
import { StreamingService } from '../streaming/streaming.service';

@Module({
  providers: [WebSocketGateway, ChatService, StreamingService],
  exports: [WebSocketGateway],
})
export class WebSocketModule {}


