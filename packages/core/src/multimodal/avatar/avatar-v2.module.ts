import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EventsModule } from '../../events/events.module';
import { MultimodalModule } from '../multimodal.module';
import { AvatarV2Service } from './avatar-v2.service';
import { AvatarService, AvatarRepoClient, GLBProcessorService, AvaturnAdapterService } from '@wattweiser/avatar';

/**
 * Avatar V2 Module
 * 
 * Three.js/R3F-basierter Avatar-Service mit HeyGen-Qualität
 */
@Module({
  imports: [EventsModule, MultimodalModule, HttpModule],
  providers: [
    AvatarV2Service,
    AvatarService,
    AvatarRepoClient,
    GLBProcessorService,
    AvaturnAdapterService,
  ],
  exports: [AvatarV2Service, AvatarService],
})
export class AvatarV2Module {}
