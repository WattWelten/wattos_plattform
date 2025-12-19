import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PersonaGeneratorService } from './persona-generator.service';
import { GeneratePersonasDto } from './dto/generate-personas.dto';

@Controller('personas')
export class PersonaGeneratorController {
  constructor(private readonly personaGeneratorService: PersonaGeneratorService) {}

  /**
   * Personas für einen Character generieren
   */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generatePersonas(@Body() dto: GeneratePersonasDto) {
    return this.personaGeneratorService.generatePersonasForCharacter(dto.characterId, {
      maxPersonas: dto.maxPersonas,
      minQualityScore: dto.minQualityScore,
    });
  }
}


