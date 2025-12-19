import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpModule } from '@nestjs/axios';
import { TtsModule } from './tts/tts.module';
import { SttModule } from './stt/stt.module';
import { VoiceStreamingModule } from './voice-streaming/voice-streaming.module';
import { HealthModule } from './health/health.module';
import { ServiceDiscoveryModule } from '@wattweiser/shared';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    HttpModule,
    ServiceDiscoveryModule,
    TtsModule,
    SttModule,
    VoiceStreamingModule,
    HealthModule,
  ],
})
export class AppModule {}

