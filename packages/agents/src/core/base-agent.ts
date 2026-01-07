import { v4 as uuidv4 } from 'uuid';
import { AgentRun } from '@wattweiser/shared';
import {
  IAgent,
  AgentState,
  AgentConfig,
  AgentMessage,
} from '../interfaces';
import { PersonaEngine } from '../persona/persona-engine';
import { MemoryManager } from '../memory/memory-manager';
import { PolicyEnforcer } from '../policies/policy-enforcer';
import { EvaluationHooks } from '../evaluation/evaluation-hooks';

/**
 * Base Agent Class
 * Alle konkreten Agenten erben von dieser Klasse
 */
export abstract class BaseAgent implements IAgent {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly config: AgentConfig;

  protected personaEngine: PersonaEngine;
  protected memoryManager: MemoryManager;
  protected policyEnforcer: PolicyEnforcer;
  protected evaluationHooks: EvaluationHooks;
  protected stateStore: Map<string, AgentState> = new Map();

  constructor(config: AgentConfig) {
    this.id = config.agent.id;
    this.tenantId = config.agent.tenantId;
    this.config = config;

    this.personaEngine = new PersonaEngine(config.persona);
    this.memoryManager = new MemoryManager(config.memoryConfig);
    this.policyEnforcer = new PolicyEnforcer(config.policies);
    this.evaluationHooks = new EvaluationHooks(config.kpi);
  }

  /**
   * Initialisierung des Agenten
   */
  async initialize(): Promise<void> {
    try {
      await this.personaEngine.initialize();
      await this.memoryManager.initialize();
      await this.policyEnforcer.initialize();
      await this.evaluationHooks.initialize();

      // Hook: Pre-Initialization
      const preInitResult = await this.evaluationHooks.preExecution({
        agentId: this.id,
        runId: 'init',
        state: this.createInitialState(''),
        phase: 'pre_execution',
      });

      if (!preInitResult.success) {
        throw new Error(`Pre-initialization failed: ${preInitResult.message}`);
      }

      // Agent-spezifische Initialisierung
      await this.onInitialize();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Agent initialization failed: ${errorMessage}`);
    }
  }

  /**
   * Agent-Run ausführen
   */
  async run(input: string, userId?: string): Promise<AgentRun> {
    const runId = uuidv4();
    const state = this.createInitialState(input, userId, runId);

    try {
      // State speichern
      this.stateStore.set(runId, state);

      // Pre-Execution Hook
      const preResult = await this.evaluationHooks.preExecution({
        agentId: this.id,
        runId,
        state,
        phase: 'pre_execution',
      });

      if (!preResult.success) {
        state.status = 'failed';
        state.error = preResult.message || 'Pre-execution validation failed';
        return this.createAgentRun(state, runId);
      }

      // Policy-Check: Input-Validierung
      const policyCheck = await this.policyEnforcer.validateInput(input);
      if (!policyCheck.allowed) {
        state.status = 'failed';
        state.error = policyCheck.reason || 'Input validation failed';
        return this.createAgentRun(state, runId);
      }

      // State auf 'running' setzen
      state.status = 'running';

      // System-Prompt generieren
      const systemPrompt = await this.personaEngine.generateSystemPrompt(state);

      // Memory: Conversation History laden
      const memoryContext = await this.memoryManager.getContext(runId);
      state.memory = memoryContext;

      // Messages aufbauen
      const messages: AgentMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
          timestamp: new Date(),
        },
        ...memoryContext.conversationHistory,
        {
          role: 'user',
          content: input,
          timestamp: new Date(),
        },
      ];

      state.messages = messages;

      // Agent-spezifische Ausführung (muss von Subklasse implementiert werden)
      const output = await this.execute(state);

      // Output validieren
      if (!output) {
        throw new Error('Agent execution returned no output');
      }

      state.output = output;
      state.status = 'completed';
      state.metrics.endTime = new Date();
      state.metrics.duration =
        state.metrics.endTime.getTime() - state.metrics.startTime.getTime();

      // Memory: Conversation History aktualisieren
      await this.memoryManager.addMessage(runId, {
        role: 'user',
        content: input,
        timestamp: new Date(),
      });
      await this.memoryManager.addMessage(runId, {
        role: 'assistant',
        content: output,
        timestamp: new Date(),
      });

      // Post-Execution Hook
      await this.evaluationHooks.postExecution({
        agentId: this.id,
        runId,
        state,
        phase: 'post_execution',
      });

      // KPI-Tracking
      await this.evaluationHooks.trackKPI({
        agentId: this.id,
        runId,
        state,
        phase: 'kpi_tracking',
      });

      return this.createAgentRun(state, runId);
    } catch (error) {
      state.status = 'failed';
      state.error = error instanceof Error ? error.message : 'Unknown error';
      state.metrics.endTime = new Date();
      state.metrics.duration =
        state.metrics.endTime.getTime() - state.metrics.startTime.getTime();

      // Error Hook
      await this.evaluationHooks.onError({
        agentId: this.id,
        runId,
        state,
        phase: 'error',
      });

      return this.createAgentRun(state, runId);
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    await this.memoryManager.cleanup();
    await this.policyEnforcer.cleanup();
    await this.evaluationHooks.cleanup();
    await this.onCleanup();
    this.stateStore.clear();
  }

  /**
   * State abrufen
   */
  async getState(runId: string): Promise<AgentState | null> {
    return this.stateStore.get(runId) || null;
  }

  /**
   * Initial State erstellen
   */
  protected createInitialState(
    input: string,
    userId?: string,
    _runId?: string,
  ): AgentState {
    const state: AgentState = {
      agentId: this.id,
      tenantId: this.tenantId,
      input,
      messages: [],
      toolCalls: [],
      memory: {
        conversationHistory: [],
        longTermFacts: {},
        tokenCount: 0,
        maxTokens: this.config.memoryConfig.maxTokens,
      },
      status: 'pending',
      metrics: {
        startTime: new Date(),
        tokenUsage: {
          prompt: 0,
          completion: 0,
          total: 0,
        },
        costUsd: 0,
        toolCallsCount: 0,
        retryCount: 0,
        kpiMetrics: {},
      },
      metadata: {},
    };
    
    if (userId !== undefined) {
      state.userId = userId;
    }
    
    return state;
  }

  /**
   * AgentRun aus State erstellen
   */
  protected createAgentRun(state: AgentState, runId: string): AgentRun {
    const run: AgentRun = {
      id: runId,
      agentId: this.id,
      input: state.input,
      status: state.status as 'pending' | 'running' | 'completed' | 'failed',
      metrics: {
        ...state.metrics,
        duration: state.metrics.duration,
      },
      createdAt: state.metrics.startTime,
    };
    
    if (state.userId !== undefined) {
      run.userId = state.userId;
    }
    
    if (state.output !== undefined) {
      run.output = state.output;
    }
    
    if (state.metrics.endTime !== undefined) {
      run.completedAt = state.metrics.endTime;
    }
    
    return run;
  }

  /**
   * Abstrakte Methoden (müssen von Subklassen implementiert werden)
   */

  /**
   * Agent-spezifische Initialisierung
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Agent-spezifische Ausführung
   * @param state Aktueller Agent State
   * @returns Output des Agenten
   */
  protected abstract execute(state: AgentState): Promise<string>;

  /**
   * Agent-spezifisches Cleanup
   */
  protected abstract onCleanup(): Promise<void>;
}


