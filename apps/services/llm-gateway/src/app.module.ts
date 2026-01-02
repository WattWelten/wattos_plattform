import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@wattweiser/db';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { LlmModule } from './llm/llm.module';
import { HealthController } from './health.controller';
import { ObservabilityModule, ResilienceModule } from '@wattweiser/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    HttpModule.register({ timeout: 1000 * 30 }),
    ObservabilityModule,
    ResilienceModule,
    LlmModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
