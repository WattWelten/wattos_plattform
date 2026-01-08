import { Module } from '@nestjs/common';
import { PrismaModule } from '@wattweiser/db';
import { FeedbackController } from './feedback.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FeedbackController],
})
export class FeedbackModule {}
