import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { EventsModule, ChannelsModule } from '@wattweiser/core';
import { ObservabilityModule, ServiceDiscoveryModule } from '@wattweiser/shared';
import { WhatsAppBotService } from './whatsapp-bot.service';
import { WhatsAppBotController } from './whatsapp-bot.controller';
import { MetaWhatsAppAdapter } from './adapters/meta.adapter';

/**
 * WhatsApp-Bot Module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    EventsModule,
    ChannelsModule,
    ObservabilityModule,
    ServiceDiscoveryModule,
  ],
  controllers: [WhatsAppBotController],
  providers: [WhatsAppBotService, MetaWhatsAppAdapter],
  exports: [WhatsAppBotService],
})
export class WhatsAppBotModule {}

