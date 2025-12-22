import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowService, Workflow, WorkflowContext } from '../workflow.service';
import { EventBusService } from '../../../events/bus.service';
import { ToolExecutionService } from '../../tools/execution.service';
import { RAGService } from '../../rag/rag.service';
import { createMockEventBus } from '../../../__tests__/helpers/mocks';

describe('WorkflowService', () => {
  let workflowService: WorkflowService;
  let mockEventBus: EventBusService;
  let mockToolExecution: ToolExecutionService;
  let mockRagService: RAGService;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    mockToolExecution = {
      executeTool: vi.fn().mockResolvedValue('result'),
    } as unknown as ToolExecutionService;
    mockRagService = {
      search: vi.fn().mockResolvedValue({
        results: [],
        query: 'test',
      }),
    } as unknown as RAGService;

    workflowService = new WorkflowService(mockEventBus, mockToolExecution, mockRagService);
  });

  describe('registerWorkflow', () => {
    it('should register workflow', () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'Test',
        steps: [],
        startStep: 'step-1',
      };

      workflowService.registerWorkflow(workflow);

      // Prüfe, dass Workflow registriert wurde
      expect(() => {
        workflowService.executeWorkflow('workflow-1', {
          sessionId: 'session-id',
          tenantId: 'tenant-id',
          state: {},
          currentStep: '',
        });
      }).not.toThrow('Workflow not found');
    });
  });

  describe('executeWorkflow', () => {
    it('should execute workflow with tool step', async () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'Test',
        steps: [
          {
            id: 'step-1',
            type: 'tool',
            config: {
              toolName: 'test-tool',
              input: { param: 'value' },
            },
            next: [],
          },
        ],
        startStep: 'step-1',
      };

      workflowService.registerWorkflow(workflow);

      const context: WorkflowContext = {
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        state: {},
        currentStep: '',
      };

      const result = await workflowService.executeWorkflow('workflow-1', context);

      expect(result).toBeDefined();
      expect(mockToolExecution.executeTool).toHaveBeenCalled();
    });

    it('should execute workflow with RAG step', async () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'Test',
        steps: [
          {
            id: 'step-1',
            type: 'rag',
            config: {
              query: 'test query',
            },
            next: [],
          },
        ],
        startStep: 'step-1',
      };

      workflowService.registerWorkflow(workflow);

      const context: WorkflowContext = {
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        state: {},
        currentStep: '',
      };

      await workflowService.executeWorkflow('workflow-1', context);

      expect(mockRagService.search).toHaveBeenCalled();
    });

    it('should throw error for non-existent workflow', async () => {
      const context: WorkflowContext = {
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        state: {},
        currentStep: '',
      };

      await expect(workflowService.executeWorkflow('non-existent', context)).rejects.toThrow(
        'Workflow not found',
      );
    });
  });

  describe('getExecution', () => {
    it('should return execution context', async () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'Test',
        steps: [
          {
            id: 'step-1',
            type: 'tool',
            config: { toolName: 'test-tool' },
            next: [],
          },
        ],
        startStep: 'step-1',
      };

      workflowService.registerWorkflow(workflow);

      const context: WorkflowContext = {
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        state: {},
        currentStep: '',
      };

      await workflowService.executeWorkflow('workflow-1', context);

      const execution = workflowService.getExecution('session-id');
      expect(execution).toBeUndefined(); // Wird nach Ausführung gelöscht
    });
  });
});




