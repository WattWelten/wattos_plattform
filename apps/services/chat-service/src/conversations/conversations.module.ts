import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { StreamingService } from '../streaming/streaming.service';

@Module({
  imports: [HttpModule],
  controllers: [ConversationsController],
  providers: [ConversationsService, StreamingService],
  exports: [ConversationsService],
})
export class ConversationsModule {}

