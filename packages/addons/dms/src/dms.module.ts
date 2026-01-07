import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DMSService } from './dms.service';
import { DMSSyncService } from './dms-sync.service';
import { DMSClient } from './client';

/**
 * DMS Module
 *
 * DMS (Document Management System) Integration Module
 * Provides DMS services for document synchronization and import
 */
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [DMSClient, DMSService, DMSSyncService],
  exports: [DMSService, DMSSyncService],
})
export class DMSModule {}

