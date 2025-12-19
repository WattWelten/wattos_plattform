import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { DbService } from './db.service';
import { JwtAuthGuard } from '@nestjs/passport';

/**
 * DB Controller
 * Bietet HTTP-API für DB-Operationen (für Python-Services)
 */
@Controller('db')
export class DbController {
  constructor(private readonly dbService: DbService) {}

  @Post('documents')
  async createDocument(@Body() dto: { id: string; knowledgeSpaceId: string; fileName: string; filePath: string; fileType?: string; fileSize: number }) {
    return this.dbService.createDocument(dto);
  }

  @Post('chunks')
  async createChunks(@Body() dto: { chunks: Array<{ id: string; documentId: string; content: string; chunkIndex: number; metadata: any; embedding: number[] }> }) {
    return this.dbService.createChunks(dto.chunks);
  }

  @Get('documents/:id')
  async getDocument(@Param('id') id: string) {
    return this.dbService.getDocument(id);
  }
}














