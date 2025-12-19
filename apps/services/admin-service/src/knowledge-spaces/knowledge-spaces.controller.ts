import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { KnowledgeSpacesService } from './knowledge-spaces.service';
import { CreateKnowledgeSpaceDto } from './dto/create-knowledge-space.dto';
import { JwtAuthGuard } from '@nestjs/passport';
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('knowledge-spaces')
@UseGuards(JwtAuthGuard)
export class KnowledgeSpacesController {
  constructor(private readonly knowledgeSpacesService: KnowledgeSpacesService) {}

  @Post()
  async createKnowledgeSpace(
    @Body() dto: CreateKnowledgeSpaceDto,
    @Tenant() tenantId: string
  ) {
    return this.knowledgeSpacesService.createKnowledgeSpace(dto, tenantId);
  }

  @Get()
  async listKnowledgeSpaces(@Tenant() tenantId: string) {
    return this.knowledgeSpacesService.listKnowledgeSpaces(tenantId);
  }

  @Get(':id')
  async getKnowledgeSpace(@Param('id') id: string) {
    return this.knowledgeSpacesService.getKnowledgeSpace(id);
  }
}




