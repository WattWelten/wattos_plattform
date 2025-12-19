import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { RegistryService } from './registry.service';
import { ToolDefinition } from './interfaces/tool.interface';

@Controller('registry')
export class RegistryController {
  constructor(private readonly registryService: RegistryService) {}

  @Get('tools')
  getAllTools() {
    return this.registryService.getAll();
  }

  @Get('tools/:toolId')
  getTool(@Param('toolId') toolId: string) {
    const tool = this.registryService.get(toolId);
    if (!tool) {
      return { error: `Tool ${toolId} not found` };
    }
    return tool;
  }

  @Post('tools')
  registerTool(@Body() tool: ToolDefinition) {
    this.registryService.register(tool);
    return { success: true, toolId: tool.id };
  }

  @Delete('tools/:toolId')
  unregisterTool(@Param('toolId') toolId: string) {
    this.registryService.unregister(toolId);
    return { success: true };
  }
}


