import { Controller, Post, Get, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CharacterService } from './character.service';
import { CharacterDefinitionService } from './character-definition.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { DefineCharacterDto } from './dto/define-character.dto';

@Controller('api/v1/characters')
export class CharacterController {
  constructor(
    private readonly characterService: CharacterService,
    private readonly characterDefinitionService: CharacterDefinitionService,
  ) {}

  /**
   * Charakter aus Prompt definieren (MVP: LLM-basierte Extraktion)
   */
  @Post('define')
  @HttpCode(HttpStatus.CREATED)
  async defineCharacter(@Body() dto: DefineCharacterDto) {
    return this.characterDefinitionService.defineCharacterFromPrompt(
      dto.tenantId,
      dto.prompt,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCharacter(@Body() dto: CreateCharacterDto, @Query('tenantId') tenantId?: string) {
    return this.characterService.createCharacter(dto, tenantId);
  }

  @Get()
  async listCharacters(@Query('tenantId') tenantId?: string) {
    return this.characterService.listCharacters(tenantId);
  }

  @Get(':role')
  async getCharacterByRole(
    @Param('role') role: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.characterService.getCharacterByRole(role, tenantId);
  }

  @Put(':id')
  async updateCharacter(@Param('id') id: string, @Body() dto: Partial<CreateCharacterDto>) {
    return this.characterService.updateCharacter(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCharacter(@Param('id') id: string) {
    return this.characterService.deleteCharacter(id);
  }
}

