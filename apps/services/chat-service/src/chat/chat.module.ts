import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { StreamingService } from '../streaming/streaming.service';

@Module({
  providers: [ChatService, StreamingService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}


