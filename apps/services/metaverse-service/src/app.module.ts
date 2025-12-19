import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetaverseModule } from './metaverse/metaverse.module';
import { ServiceDiscoveryModule } from '@wattweiser/shared';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ServiceDiscoveryModule, MetaverseModule],
})
export class AppModule {}


