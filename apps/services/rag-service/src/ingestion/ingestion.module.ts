import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { FileIngestionService } from './file-ingestion.service';
import { WebsiteIngestionService } from './website-ingestion.service';
import { VectorStoreModule } from '../vector-store/vector-store.module';
// DocumentProcessorService wird direkt importiert (kein NestJS-Modul)
import { PrismaModule } from '@wattweiser/db';

@Module({
  imports: [VectorStoreModule, PrismaModule],
  controllers: [IngestionController],
  providers: [FileIngestionService, WebsiteIngestionService],
  exports: [FileIngestionService, WebsiteIngestionService],
})
export class IngestionModule {}
