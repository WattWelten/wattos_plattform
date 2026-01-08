import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileIngestionService, FileIngestionRequest } from './file-ingestion.service';
import { WebsiteIngestionService, WebsiteIngestionRequest } from './website-ingestion.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
// Auth wird über Gateway gehandhabt, kein direkter Guard nötig

@ApiTags('ingestion')
@Controller('ingestion')
export class IngestionController {
  constructor(
    private readonly fileIngestionService: FileIngestionService,
    private readonly websiteIngestionService: WebsiteIngestionService,
  ) {}

  @Post('file')
  @ApiOperation({ summary: 'Upload and ingest a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        knowledgeSpaceId: {
          type: 'string',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async ingestFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { knowledgeSpaceId: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!body.knowledgeSpaceId) {
      throw new BadRequestException('knowledgeSpaceId is required');
    }

    const request: FileIngestionRequest = {
      file,
      knowledgeSpaceId: body.knowledgeSpaceId,
    };

    return this.fileIngestionService.ingestFile(request);
  }

  @Post('website')
  @ApiOperation({ summary: 'Crawl and ingest a website' })
  async ingestWebsite(@Body() request: WebsiteIngestionRequest) {
    if (!request.url) {
      throw new BadRequestException('URL is required');
    }

    if (!request.knowledgeSpaceId) {
      throw new BadRequestException('knowledgeSpaceId is required');
    }

    return this.websiteIngestionService.ingestWebsite(request);
  }
}
