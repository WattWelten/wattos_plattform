import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../events/bus.service';
import { ToolExecutionService } from '../tools/execution.service';
import { RAGService } from '../rag/rag.service';

/**
 * Workflow Step
 */
export interface WorkflowStep {
  id: string;
  type: 'tool' | 'rag' | 'condition' | 'parallel';
  config: Record<string, any>;
  next?: string[];
  condition?: (context: WorkflowContext) => boolean;
}

/**
 * Workflow Definition
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  startStep: string;
}

/**
 * Workflow Context
 */
export interface WorkflowContext {
  sessionId: string;
  tenantId: string;
  userId?: string;
  state: Record<string, any>;
  currentStep: string;
}

/**
 * Workflow Service
 * 
 * Verwaltet Workflow-Execution mit Genehmigung und Nachvollziehbarkeit
 */
@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowContext> = new Map();

  constructor(
    private readonly eventBus: EventBusService,
    private readonly toolExecution: ToolExecutionService,
    private readonly ragService: RAGService,
  ) {}

  /**
   * Workflow registrieren
   */
  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
    this.logger.log(`Workflow registered: ${workflow.name} (${workflow.id})`);
  }

  /**
   * Workflow ausführen
   */
  async executeWorkflow(
    workflowId: string,
    context: WorkflowContext,
  ): Promise<WorkflowContext> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    this.executions.set(context.sessionId, context);
    this.logger.debug(`Executing workflow: ${workflow.name}`, { sessionId: context.sessionId });

    let currentStepId = workflow.startStep;

    while (currentStepId) {
      const step = workflow.steps.find((s) => s.id === currentStepId);
      if (!step) {
        throw new Error(`Workflow step not found: ${currentStepId}`);
      }

      context.currentStep = currentStepId;

      // Führe Step aus
      await this.executeStep(step, context);

      // Bestimme nächsten Step
      if (step.next && step.next.length > 0) {
        // TODO: Condition-Logik implementieren
        currentStepId = step.next[0];
      } else {
        break;
      }
    }

    this.executions.delete(context.sessionId);
    return context;
  }

  /**
   * Step ausführen
   */
  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<void> {
    switch (step.type) {
      case 'tool':
        await this.toolExecution.executeTool(
          step.config.toolName,
          step.config.input || {},
          context.sessionId,
          context.tenantId,
          context.userId,
        );
        break;

      case 'rag':
        await this.ragService.search(step.config.query, {
          tenantId: context.tenantId,
          knowledgeSpaceId: step.config.knowledgeSpaceId,
        });
        break;

      case 'parallel':
        await Promise.all(
          (step.config.steps || []).map((subStep: WorkflowStep) =>
            this.executeStep(subStep, context),
          ),
        );
        break;

      default:
        this.logger.warn(`Unknown workflow step type: ${step.type}`);
    }
  }

  /**
   * Workflow-Execution abrufen
   */
  getExecution(sessionId: string): WorkflowContext | undefined {
    return this.executions.get(sessionId);
  }
}

