import { Module } from '@nestjs/common';
import { WhatsAppBotModule } from './whatsapp-bot/whatsapp-bot.module';
import { HealthController } from '@wattweiser/shared';

@Module({
  imports: [WhatsAppBotModule],
  controllers: [HealthController],
})
export class AppModule {}

