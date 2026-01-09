import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebChatModule } from './web-chat/web-chat.module';
import { ObservabilityModule, HealthController, ServiceDiscoveryModule } from '@wattweiser/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ObservabilityModule,
    ServiceDiscoveryModule,
    WebChatModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

