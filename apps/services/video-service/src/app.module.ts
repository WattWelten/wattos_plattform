import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { VideoModule } from './video/video.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from '@wattweiser/db';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    VideoModule,
    HealthModule,
  ],
})
export class AppModule {}
