import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PhoneBotModule } from './phone-bot/phone-bot.module';
import { ObservabilityModule, HealthController, ServiceDiscoveryModule } from '@wattweiser/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ObservabilityModule,
    ServiceDiscoveryModule,
    PhoneBotModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

