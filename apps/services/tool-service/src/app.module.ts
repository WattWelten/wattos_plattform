import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ToolModule } from './tool/tool.module';
import { RegistryModule } from './registry/registry.module';
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
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    ServiceDiscoveryModule,
    ToolModule,
    RegistryModule,
  ],
})
export class AppModule {}


