import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolExecutionService } from '../execution.service';
import { ToolRegistryService } from '../registry.service';
import { EventBusService } from '../../../events/bus.service';
import { createMockEventBus } from '../../../__tests__/helpers/mocks';

describe('ToolExecutionService', () => {
  let toolExecution: ToolExecutionService;
  let mockToolRegistry: ToolRegistryService;
  let mockEventBus: EventBusService;
  let mockTool: any;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    mockToolRegistry = {
      getTool: vi.fn(),
    } as unknown as ToolRegistryService;

    mockTool = {
      name: 'test-tool',
      description: 'Test tool',
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

    (mockToolRegistry.getTool as any).mockReturnValue(mockTool);

    toolExecution = new ToolExecutionService(mockToolRegistry, mockEventBus);
  });

  describe('executeTool', () => {
    it('should execute tool successfully', async () => {
      const result = await toolExecution.executeTool(
        'test-tool',
        { input: 'test' },
        'session-id',
        'tenant-id',
        'user-id',
      );

      expect(result).toBe('result');
      expect(mockTool.execute).toHaveBeenCalledWith({ input: 'test' });
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should throw error for non-existent tool', async () => {
      (mockToolRegistry.getTool as any).mockReturnValueOnce(undefined);

      await expect(
        toolExecution.executeTool('non-existent', {}, 'session-id', 'tenant-id'),
      ).rejects.toThrow('Tool not found');
    });

    it('should validate required parameters', async () => {
      await expect(
        toolExecution.executeTool('test-tool', {}, 'session-id', 'tenant-id'),
      ).rejects.toThrow('Required parameter missing');
    });

    it('should validate parameter types', async () => {
      await expect(
        toolExecution.executeTool('test-tool', { input: 123 }, 'session-id', 'tenant-id'),
      ).rejects.toThrow('must be of type');
    });

    it('should emit failure event on error', async () => {
      (mockTool.execute as any).mockRejectedValueOnce(new Error('Tool error'));

      await expect(
        toolExecution.executeTool('test-tool', { input: 'test' }, 'session-id', 'tenant-id'),
      ).rejects.toThrow('Tool error');

      expect(mockEventBus.emit).toHaveBeenCalled();
    });
  });
});






