import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { TextStreamingService } from './text/streaming.service';
import { AsrService } from './voice/asr.service';
import { TtsService } from './voice/tts.service';
import { AvatarV2Module } from './avatar/avatar-v2.module';

/**
 * Multimodal Module
 * 
 * Multimodale Runtime für Text, Voice, Avatar, Vision
 */
@Module({
  imports: [EventsModule, AvatarV2Module],
  providers: [TextStreamingService, AsrService, TtsService],
  exports: [TextStreamingService, AsrService, TtsService, AvatarV2Module],
})
export class MultimodalModule {}

