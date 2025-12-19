import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ChatModule } from './chat/chat.module';
import { ConversationsModule } from './conversations/conversations.module';
import { WebSocketModule } from './websocket/websocket.module';
import { SseModule } from './sse/sse.module';
import { ObservabilityModule, ServiceDiscoveryModule } from '@wattweiser/shared';
import { HealthController } from '@wattweiser/shared';
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
    ObservabilityModule,
    ServiceDiscoveryModule,
    ChatModule,
    ConversationsModule,
    WebSocketModule,
    SseModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}


