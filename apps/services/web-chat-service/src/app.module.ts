import { Module } from '@nestjs/common';
import { WebChatModule } from './web-chat/web-chat.module';
import { HealthController } from '@wattweiser/shared';

@Module({
  imports: [WebChatModule],
  controllers: [HealthController],
})
export class AppModule {}

