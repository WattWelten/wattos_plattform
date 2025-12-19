import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpModule } from '@nestjs/axios';
import { AvatarModule } from './avatar/avatar.module';
import { HealthModule } from './health/health.module';
import { ServiceDiscoveryModule } from '@wattweiser/shared';
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
    HttpModule,
    ServiceDiscoveryModule,
    AvatarModule,
    HealthModule,
  ],
})
export class AppModule {}


