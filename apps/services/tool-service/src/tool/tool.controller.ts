import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ToolService } from './tool.service';
import { ToolExecutionRequest } from '../registry/interfaces/tool.interface';

@Controller('tools')
export class ToolController {
  constructor(private readonly toolService: ToolService) {}

  @Post('execute')
  async executeTool(@Body() request: ToolExecutionRequest) {
    return this.toolService.executeTool(request);
  }

  @Get(':toolId/health')
  async healthCheck(@Param('toolId') toolId: string) {
    const healthy = await this.toolService.healthCheck(toolId);
    return { toolId, healthy };
  }
}


