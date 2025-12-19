import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ToolDefinition, ToolExecutionRequest, ToolExecutionResult } from '../registry/interfaces/tool.interface';
import { IToolAdapter } from '../adapters/interfaces/adapter.interface';

/**
 * Execution Service
 * Führt Tools mit Sandboxing und Timeout-Handling aus
 */
@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Tool ausführen
   */
  async execute(
    request: ToolExecutionRequest,
    tool: ToolDefinition,
    adapter: IToolAdapter,
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const timeout = tool.timeout || this.configService.get('sandbox.timeout') || 30000;

    try {
      // Timeout-Wrapper
      const result = await Promise.race([
        adapter.execute(request),
        this.createTimeout(timeout),
      ]);

      if (result === 'timeout') {
        return {
          success: false,
          error: `Tool execution timed out after ${timeout}ms`,
          executionTime: Date.now() - startTime,
        };
      }

      return result as ToolExecutionResult;
    } catch (error: any) {
      this.logger.error(`Tool execution error: ${error.message}`);

      return {
        success: false,
        error: error.message || 'Tool execution failed',
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Timeout erstellen
   */
  private createTimeout(ms: number): Promise<'timeout'> {
    return new Promise((resolve) => {
      setTimeout(() => resolve('timeout'), ms);
    });
  }
}


