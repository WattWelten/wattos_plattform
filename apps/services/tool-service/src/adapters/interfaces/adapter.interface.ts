import { ToolExecutionRequest, ToolExecutionResult } from '../../registry/interfaces/tool.interface';

/**
 * Tool Adapter Interface
 * Alle Adapter müssen diese Schnittstelle implementieren
 */
export interface IToolAdapter {
  /**
   * Tool ausführen
   */
  execute(request: ToolExecutionRequest): Promise<ToolExecutionResult>;

  /**
   * Input validieren
   */
  validateInput(input: Record<string, any>): Promise<boolean>;

  /**
   * Health Check
   */
  healthCheck(): Promise<boolean>;
}


