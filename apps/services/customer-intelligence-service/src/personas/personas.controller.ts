import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PersonasService } from './personas.service';
import { RefinePersonaDto } from './dto/refine-persona.dto';

@Controller('api/v1/analytics')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Get(':analysisId/personas')
  async getPersonasByAnalysis(@Param('analysisId') analysisId: string) {
    return this.personasService.getPersonasByAnalysis(analysisId);
  }

  @Get('personas/:id')
  async getPersona(@Param('id') id: string) {
    return this.personasService.getPersona(id);
  }

  @Post('personas/:id/refine')
  async refinePersona(@Param('id') id: string, @Body() dto: RefinePersonaDto) {
    return this.personasService.refinePersona(id, dto);
  }
}














