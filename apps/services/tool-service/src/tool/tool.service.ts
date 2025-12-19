import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RegistryService } from '../registry/registry.service';
import { AdapterFactory } from '../adapters/adapter.factory';
import { ExecutionService } from '../execution/execution.service';
import { ToolExecutionRequest, ToolExecutionResult } from '../registry/interfaces/tool.interface';

/**
 * Tool Service
 * Orchestriert Tool-Ausführungen
 */
@Injectable()
export class ToolService {
  private readonly logger = new Logger(ToolService.name);

  constructor(
    private readonly registryService: RegistryService,
    private readonly adapterFactory: AdapterFactory,
    private readonly executionService: ExecutionService,
  ) {}

  /**
   * Tool ausführen
   */
  async executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    try {
      // Tool aus Registry abrufen
      const tool = this.registryService.get(request.toolId);
      if (!tool) {
        throw new NotFoundException(`Tool ${request.toolId} not found`);
      }

      // Adapter abrufen
      const adapter = this.adapterFactory.getAdapter(tool.adapter);
      if (!adapter) {
        throw new Error(`Adapter ${tool.adapter} not found`);
      }

      // Input validieren
      const isValid = await adapter.validateInput(request.input);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid input',
          executionTime: 0,
        };
      }

      // Tool ausführen (mit Sandboxing, falls aktiviert)
      const result = await this.executionService.execute(request, tool, adapter);

      return result;
    } catch (error: any) {
      this.logger.error(`Tool execution failed: ${error.message}`);

      return {
        success: false,
        error: error.message || 'Tool execution failed',
        executionTime: 0,
      };
    }
  }

  /**
   * Tool Health Check
   */
  async healthCheck(toolId: string): Promise<boolean> {
    try {
      const tool = this.registryService.get(toolId);
      if (!tool) {
        return false;
      }

      const adapter = this.adapterFactory.getAdapter(tool.adapter);
      if (!adapter) {
        return false;
      }

      return await adapter.healthCheck();
    } catch {
      return false;
    }
  }
}


