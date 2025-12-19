import { Controller, Post, Get, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ArtifactsService } from './artifacts.service';
import { AddArtifactDto } from './dto/add-artifact.dto';

@Controller('artifacts')
export class ArtifactsController {
  constructor(private readonly artifactsService: ArtifactsService) {}

  @Post('add_url')
  @HttpCode(HttpStatus.CREATED)
  async addArtifactByUrl(@Body() dto: AddArtifactDto) {
    return this.artifactsService.addArtifactByUrl(dto);
  }

  @Get()
  async listArtifacts(@Query('character') character?: string) {
    return this.artifactsService.listArtifacts(character);
  }

  @Get(':id')
  async getArtifact(@Param('id') id: string) {
    return this.artifactsService.getArtifact(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteArtifact(@Param('id') id: string) {
    return this.artifactsService.deleteArtifact(id);
  }
}

