import { Injectable, Logger } from '@nestjs/common';

/**
 * Tool Definition
 */
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (input: Record<string, any>) => Promise<any>;
  healthCheck?: () => Promise<boolean>;
}

/**
 * Tool Parameter
 */
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

/**
 * Tool Registry Service
 * 
 * Zentrale Registrierung aller verfügbaren Tools
 */
@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);
  private tools: Map<string, Tool> = new Map();

  /**
   * Tool registrieren
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      this.logger.warn(`Tool already registered: ${tool.name}, overwriting...`);
    }

    this.tools.set(tool.name, tool);
    this.logger.log(`Tool registered: ${tool.name}`);
  }

  /**
   * Tool entfernen
   */
  unregisterTool(toolName: string): void {
    this.tools.delete(toolName);
    this.logger.log(`Tool unregistered: ${toolName}`);
  }

  /**
   * Tool abrufen
   */
  getTool(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Alle Tools auflisten
   */
  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Tools nach Kategorie filtern
   */
  getToolsByCategory(category: string): Tool[] {
    // TODO: Kategorie-System implementieren
    return Array.from(this.tools.values());
  }

  /**
   * Tool-Health-Check
   */
  async healthCheck(toolName: string): Promise<boolean> {
    const tool = this.getTool(toolName);
    if (!tool) {
      return false;
    }

    if (tool.healthCheck) {
      try {
        return await tool.healthCheck();
      } catch {
        return false;
      }
    }

    return true;
  }
}

