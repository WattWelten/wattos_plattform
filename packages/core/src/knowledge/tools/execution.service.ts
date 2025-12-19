import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../events/bus.service';
import { ToolRegistryService } from './registry.service';
import { EventDomain, ToolEventSchema } from '../../events/types';
import { v4 as uuid } from 'uuid';

/**
 * Tool Execution Service
 * 
 * Führt Tool-Aufrufe aus mit Sandboxing und Error-Handling
 */
@Injectable()
export class ToolExecutionService {
  private readonly logger = new Logger(ToolExecutionService.name);

  constructor(
    private readonly toolRegistry: ToolRegistryService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Tool ausführen
   */
  async executeTool(
    toolName: string,
    input: Record<string, any>,
    sessionId: string,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const tool = this.toolRegistry.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Validiere Input
    this.validateInput(tool, input);

    this.logger.debug(`Executing tool: ${toolName}`, { input, sessionId });

    try {
      // Emit Tool Call Started Event
      const startEvent = ToolEventSchema.parse({
        id: uuid(),
        type: 'tool.call.executed',
        domain: EventDomain.TOOL,
        action: 'call.executed',
        timestamp: Date.now(),
        sessionId,
        tenantId,
        userId,
        payload: {
          toolName,
          toolInput: input,
        },
      });

      await this.eventBus.emit(startEvent);

      // Führe Tool aus
      const output = await tool.execute(input);

      // Emit Tool Call Success Event
      const successEvent = ToolEventSchema.parse({
        id: uuid(),
        type: 'tool.call.executed',
        domain: EventDomain.TOOL,
        action: 'call.executed',
        timestamp: Date.now(),
        sessionId,
        tenantId,
        userId,
        payload: {
          toolName,
          toolInput: input,
          toolOutput: output,
        },
      });

      await this.eventBus.emit(successEvent);

      return output;
    } catch (error: any) {
      this.logger.error(`Tool execution failed: ${toolName}`, error.stack);

      // Emit Tool Call Failed Event
      const failEvent = ToolEventSchema.parse({
        id: uuid(),
        type: 'tool.call.failed',
        domain: EventDomain.TOOL,
        action: 'call.failed',
        timestamp: Date.now(),
        sessionId,
        tenantId,
        userId,
        payload: {
          toolName,
          toolInput: input,
          error: error.message,
        },
      });

      await this.eventBus.emit(failEvent);

      throw error;
    }
  }

  /**
   * Input validieren
   */
  private validateInput(tool: { parameters: Array<{ name: string; required: boolean; type: string }> }, input: Record<string, any>): void {
    for (const param of tool.parameters) {
      if (param.required && !(param.name in input)) {
        throw new Error(`Required parameter missing: ${param.name}`);
      }

      if (param.name in input) {
        const value = input[param.name];
        const expectedType = param.type;

        // Type-Check
        if (expectedType === 'string' && typeof value !== 'string') {
          throw new Error(`Parameter ${param.name} must be of type ${expectedType}`);
        }
        if (expectedType === 'number' && typeof value !== 'number') {
          throw new Error(`Parameter ${param.name} must be of type ${expectedType}`);
        }
        if (expectedType === 'boolean' && typeof value !== 'boolean') {
          throw new Error(`Parameter ${param.name} must be of type ${expectedType}`);
        }
      }
    }
  }
}

