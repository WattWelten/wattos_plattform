import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolRegistryService, Tool, ToolParameter } from '../registry.service';

describe('ToolRegistryService', () => {
  let toolRegistry: ToolRegistryService;

  const mockTool: Tool = {
    name: 'test-tool',
    description: 'A test tool',
    parameters: [
      {
        name: 'input',
        type: 'string',
        description: 'Input parameter',
        required: true,
      },
    ],
    execute: vi.fn().mockResolvedValue('result'),
  };

  beforeEach(() => {
    toolRegistry = new ToolRegistryService();
  });

  describe('registerTool', () => {
    it('should register a tool', () => {
      toolRegistry.registerTool(mockTool);

      const tool = toolRegistry.getTool('test-tool');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('test-tool');
    });

    it('should overwrite existing tool with same name', () => {
      const firstTool: Tool = {
        ...mockTool,
        description: 'First tool',
      };
      const secondTool: Tool = {
        ...mockTool,
        description: 'Second tool',
      };

      toolRegistry.registerTool(firstTool);
      toolRegistry.registerTool(secondTool);

      const tool = toolRegistry.getTool('test-tool');
      expect(tool?.description).toBe('Second tool');
    });

    it('should register multiple tools', () => {
      const tool1: Tool = { ...mockTool, name: 'tool-1' };
      const tool2: Tool = { ...mockTool, name: 'tool-2' };

      toolRegistry.registerTool(tool1);
      toolRegistry.registerTool(tool2);

      expect(toolRegistry.listTools()).toHaveLength(2);
    });
  });

  describe('unregisterTool', () => {
    it('should remove a registered tool', () => {
      toolRegistry.registerTool(mockTool);
      expect(toolRegistry.getTool('test-tool')).toBeDefined();

      toolRegistry.unregisterTool('test-tool');

      expect(toolRegistry.getTool('test-tool')).toBeUndefined();
    });

    it('should not throw when unregistering non-existent tool', () => {
      expect(() => toolRegistry.unregisterTool('non-existent')).not.toThrow();
    });
  });

  describe('getTool', () => {
    it('should return registered tool', () => {
      toolRegistry.registerTool(mockTool);

      const tool = toolRegistry.getTool('test-tool');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('test-tool');
      expect(tool?.description).toBe('A test tool');
    });

    it('should return undefined for non-existent tool', () => {
      const tool = toolRegistry.getTool('non-existent');

      expect(tool).toBeUndefined();
    });
  });

  describe('listTools', () => {
    it('should return empty array when no tools registered', () => {
      const tools = toolRegistry.listTools();

      expect(tools).toEqual([]);
    });

    it('should return all registered tools', () => {
      const tool1: Tool = { ...mockTool, name: 'tool-1' };
      const tool2: Tool = { ...mockTool, name: 'tool-2' };
      const tool3: Tool = { ...mockTool, name: 'tool-3' };

      toolRegistry.registerTool(tool1);
      toolRegistry.registerTool(tool2);
      toolRegistry.registerTool(tool3);

      const tools = toolRegistry.listTools();

      expect(tools).toHaveLength(3);
      expect(tools.map((t) => t.name)).toEqual(['tool-1', 'tool-2', 'tool-3']);
    });
  });

  describe('getToolsByCategory', () => {
    it('should return all tools (category system not yet implemented)', () => {
      const tool1: Tool = { ...mockTool, name: 'tool-1' };
      const tool2: Tool = { ...mockTool, name: 'tool-2' };

      toolRegistry.registerTool(tool1);
      toolRegistry.registerTool(tool2);

      const tools = toolRegistry.getToolsByCategory('any-category');

      // Currently returns all tools (TODO: implement category system)
      expect(tools).toHaveLength(2);
    });
  });

  describe('healthCheck', () => {
    it('should return true for tool without healthCheck function', async () => {
      const toolWithoutHealthCheck: Tool = {
        ...mockTool,
        healthCheck: undefined,
      };

      toolRegistry.registerTool(toolWithoutHealthCheck);

      const result = await toolRegistry.healthCheck('test-tool');

      expect(result).toBe(true);
    });

    it('should return true when healthCheck succeeds', async () => {
      const toolWithHealthCheck: Tool = {
        ...mockTool,
        healthCheck: vi.fn().mockResolvedValue(true),
      };

      toolRegistry.registerTool(toolWithHealthCheck);

      const result = await toolRegistry.healthCheck('test-tool');

      expect(result).toBe(true);
      expect(toolWithHealthCheck.healthCheck).toHaveBeenCalled();
    });

    it('should return false when healthCheck fails', async () => {
      const toolWithHealthCheck: Tool = {
        ...mockTool,
        healthCheck: vi.fn().mockResolvedValue(false),
      };

      toolRegistry.registerTool(toolWithHealthCheck);

      const result = await toolRegistry.healthCheck('test-tool');

      expect(result).toBe(false);
    });

    it('should return false when healthCheck throws', async () => {
      const toolWithHealthCheck: Tool = {
        ...mockTool,
        healthCheck: vi.fn().mockRejectedValue(new Error('Health check failed')),
      };

      toolRegistry.registerTool(toolWithHealthCheck);

      const result = await toolRegistry.healthCheck('test-tool');

      expect(result).toBe(false);
    });

    it('should return false for non-existent tool', async () => {
      const result = await toolRegistry.healthCheck('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('tool execution', () => {
    it('should execute tool with correct parameters', async () => {
      const executeFn = vi.fn().mockResolvedValue('execution result');
      const tool: Tool = {
        ...mockTool,
        execute: executeFn,
      };

      toolRegistry.registerTool(tool);

      const toolInstance = toolRegistry.getTool('test-tool');
      const result = await toolInstance?.execute({ input: 'test' });

      expect(result).toBe('execution result');
      expect(executeFn).toHaveBeenCalledWith({ input: 'test' });
    });
  });
});







