import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppBotModule } from './whatsapp-bot/whatsapp-bot.module';
import { ObservabilityModule, HealthController, ServiceDiscoveryModule } from '@wattweiser/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ObservabilityModule,
    ServiceDiscoveryModule,
    WhatsAppBotModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

