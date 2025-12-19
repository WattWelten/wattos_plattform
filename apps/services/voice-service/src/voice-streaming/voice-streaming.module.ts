import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VoiceStreamingController } from './voice-streaming.controller';
import { VoiceStreamingService } from './voice-streaming.service';
import { TtsModule } from '../tts/tts.module';
import { SttModule } from '../stt/stt.module';

@Module({
  imports: [HttpModule, TtsModule, SttModule],
  controllers: [VoiceStreamingController],
  providers: [VoiceStreamingService],
  exports: [VoiceStreamingService],
})
export class VoiceStreamingModule {}














