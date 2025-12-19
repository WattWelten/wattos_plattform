import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule, MultimodalModule, ChannelsModule } from '@wattweiser/core';
import { ObservabilityModule, ServiceDiscoveryModule } from '@wattweiser/shared';
import { PhoneBotService } from './phone-bot.service';
import { PhoneBotController } from './phone-bot.controller';
import { TwilioAdapter } from './adapters/twilio.adapter';

/**
 * Phone-Bot Module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventsModule,
    MultimodalModule,
    ChannelsModule,
    ObservabilityModule,
    ServiceDiscoveryModule,
  ],
  controllers: [PhoneBotController],
  providers: [PhoneBotService, TwilioAdapter],
  exports: [PhoneBotService],
})
export class PhoneBotModule {}

