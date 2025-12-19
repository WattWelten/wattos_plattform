import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule, OrchestratorModule, ChannelsModule } from '@wattweiser/core';
import { ObservabilityModule, ServiceDiscoveryModule } from '@wattweiser/shared';
import { WebChatService } from './web-chat.service';
import { WebChatController } from './web-chat.controller';

/**
 * Web-Chat Module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventsModule,
    OrchestratorModule,
    ChannelsModule,
    ObservabilityModule,
    ServiceDiscoveryModule,
  ],
  controllers: [WebChatController],
  providers: [WebChatService],
  exports: [WebChatService],
})
export class WebChatModule {}

