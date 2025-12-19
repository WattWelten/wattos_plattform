import { Module } from '@nestjs/common';
import { SseController } from './sse.controller';
import { ChatService } from '../chat/chat.service';
import { StreamingService } from '../streaming/streaming.service';

@Module({
  providers: [ChatService, StreamingService],
  controllers: [SseController],
})
export class SseModule {}


