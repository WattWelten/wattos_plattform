import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { ChannelRouterService } from './channel-router.service';

/**
 * Channels Module
 * 
 * Channel-Abstraktion und Routing
 */
@Module({
  imports: [EventsModule],
  providers: [ChannelRouterService],
  exports: [ChannelRouterService],
})
export class ChannelsModule {}

