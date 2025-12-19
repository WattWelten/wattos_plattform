import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventBusService } from './bus.service';
import { EventMiddleware } from './middleware';

/**
 * Events Module
 * 
 * Globales Modul für Event-basierte Kommunikation
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EventBusService, EventMiddleware],
  exports: [EventBusService, EventMiddleware],
})
export class EventsModule {}

