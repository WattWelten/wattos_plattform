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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // @ts-expect-error - unused but may be needed in future
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
        // Condition-Logik: Wenn Condition-Funktion vorhanden, evaluiere sie
        if (step.condition) {
          const conditionResult = step.condition(context);
          if (conditionResult && step.next.length > 0) {
            // Condition erfüllt: Nimm ersten nächsten Step
            const nextId = step.next[0];
            if (nextId) {
              currentStepId = nextId;
            } else {
              break;
            }
          } else if (!conditionResult && step.next.length > 1) {
            // Condition nicht erfüllt: Nimm zweiten nächsten Step (else-Branch)
            const nextId = step.next[1];
            if (nextId) {
              currentStepId = nextId;
            } else {
              break;
            }
          } else {
            // Kein else-Branch: Workflow beenden
            break;
          }
        } else if (step.type === 'condition') {
          // Condition-Step mit config-basierter Evaluierung
          const conditionResult = this.evaluateCondition(step.config, context);
          if (conditionResult && step.next.length > 0) {
            const nextId = step.next[0];
            if (nextId) {
              currentStepId = nextId;
            } else {
              break;
            }
          } else if (!conditionResult && step.next.length > 1) {
            const nextId = step.next[1];
            if (nextId) {
              currentStepId = nextId;
            } else {
              break;
            }
          } else {
            break;
          }
        } else {
          // Keine Condition: Nimm ersten nächsten Step
          const nextStepId = step.next[0];
          if (nextStepId) {
            currentStepId = nextStepId;
          } else {
            break;
          }
        }
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
   * Condition evaluieren
   */
  private evaluateCondition(
    config: Record<string, any>,
    context: WorkflowContext,
  ): boolean {
    const { operator, left, right } = config;

    // Wert aus Context extrahieren
    const getValue = (path: string): any => {
      const parts = path.split('.');
      let value: any = context.state;
      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = value[part];
        } else {
          return undefined;
        }
      }
      return value;
    };

    const leftValue = typeof left === 'string' && left.startsWith('$') 
      ? getValue(left.substring(1)) 
      : left;
    const rightValue = typeof right === 'string' && right.startsWith('$')
      ? getValue(right.substring(1))
      : right;

    // Operator-basierte Evaluierung
    switch (operator) {
      case 'eq':
        return leftValue === rightValue;
      case 'ne':
        return leftValue !== rightValue;
      case 'gt':
        return Number(leftValue) > Number(rightValue);
      case 'gte':
        return Number(leftValue) >= Number(rightValue);
      case 'lt':
        return Number(leftValue) < Number(rightValue);
      case 'lte':
        return Number(leftValue) <= Number(rightValue);
      case 'contains':
        return String(leftValue).includes(String(rightValue));
      case 'in':
        return Array.isArray(rightValue) && rightValue.includes(leftValue);
      case 'and':
        return Array.isArray(left) && left.every((cond: any) => this.evaluateCondition(cond, context));
      case 'or':
        return Array.isArray(left) && left.some((cond: any) => this.evaluateCondition(cond, context));
      case 'not':
        return !this.evaluateCondition(left, context);
      default:
        this.logger.warn(`Unknown condition operator: ${operator}`);
        return false;
    }
  }

  /**
   * Workflow-Execution abrufen
   */
  getExecution(sessionId: string): WorkflowContext | undefined {
    return this.executions.get(sessionId);
  }
}

