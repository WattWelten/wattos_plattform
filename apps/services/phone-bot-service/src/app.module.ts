import { Module } from '@nestjs/common';
import { PhoneBotModule } from './phone-bot/phone-bot.module';
import { HealthController } from '@wattweiser/shared';

@Module({
  imports: [PhoneBotModule],
  controllers: [HealthController],
})
export class AppModule {}

