import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CharacterController } from './character.controller';
import { CharacterService } from './character.service';
import { CharacterDefinitionService } from './character-definition.service';
import { ProfilesModule } from '@wattweiser/core';

@Module({
  imports: [HttpModule, ProfilesModule],
  controllers: [CharacterController],
  providers: [CharacterService, CharacterDefinitionService],
  exports: [CharacterService, CharacterDefinitionService],
})
export class CharacterModule {}

