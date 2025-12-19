import { Module } from '@nestjs/common';
import { KnowledgeSpacesController } from './knowledge-spaces.controller';
import { KnowledgeSpacesService } from './knowledge-spaces.service';

@Module({
  controllers: [KnowledgeSpacesController],
  providers: [KnowledgeSpacesService],
  exports: [KnowledgeSpacesService],
})
export class KnowledgeSpacesModule {}














