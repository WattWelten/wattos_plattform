import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PersonaGeneratorController } from './persona-generator.controller';
import { PersonaGeneratorService } from './persona-generator.service';
import { QualityFilterService } from './quality-filter.service';

@Module({
  imports: [HttpModule],
  controllers: [PersonaGeneratorController],
  providers: [PersonaGeneratorService, QualityFilterService],
  exports: [PersonaGeneratorService],
})
export class PersonaGeneratorModule {}


