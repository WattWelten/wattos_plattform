import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@wattweiser/db';
import { BaseAgent, AgentConfig, AgentState } from '@wattweiser/agents';
import {
  ITSupportAgent,
  SalesAgent,
  MarketingAgent,
  LegalAgent,
  MeetingAgent,
} from '@wattweiser/agents/roles';
import { GraphService } from '../graph/graph.service';
import { GraphStateService } from '../graph/graph-state.service';
import { GraphState } from '../graph/graph-state.service';

/**
 * Agent Service
 * Orchestriert Agent-Runs mit LangGraph
 */
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private agents: Map<string, BaseAgent> = new Map();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly graphService: GraphService,
    private readonly graphStateService: GraphStateService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Agent-Run starten
   */
  async runAgent(agentId: string, input: string, userId?: string) {
    try {
      // Agent aus DB laden
      const agentData = await this.prismaService.client.agent.findUnique({
        where: { id: agentId },
      });

      if (!agentData) {
        throw new NotFoundException(`Agent ${agentId} not found`);
      }

      // Agent-Instanz erstellen oder aus Cache holen
      let agent = this.agents.get(agentId);
      if (!agent) {
        const agentConfig = await this.createAgentConfig(agentData);
        
        // Konkrete Agent-Instanz basierend auf roleType erstellen
        switch (agentData.roleType) {
          case 'it-support':
            agent = new ITSupportAgent(agentConfig);
            break;
          case 'sales':
            agent = new SalesAgent(agentConfig);
            break;
          case 'marketing':
            agent = new MarketingAgent(agentConfig);
            break;
          case 'legal':
            agent = new LegalAgent(agentConfig);
            break;
          case 'meeting':
            agent = new MeetingAgent(agentConfig);
            break;
          default:
            // Fallback: Verwende einen generischen Agent
            // Für unbekannte Typen verwenden wir einen Standard-Agent
            // Da BaseAgent abstrakt ist, erstellen wir einen einfachen Wrapper
            throw new Error(`Unknown agent roleType: ${agentData.roleType}`);
        }
        
        await agent.initialize();
        this.agents.set(agentId, agent);
      }

      // Agent-Run ausführen
      const agentRun = await agent!.run(input, userId);

      // In DB speichern
      await this.prismaService.client.agentRun.create({
        data: {
          id: agentRun.id,
          agentId: agentRun.agentId,
          userId: agentRun.userId,
          input: agentRun.input,
          output: agentRun.output,
          status: agentRun.status,
          metrics: agentRun.metrics as any,
          createdAt: agentRun.createdAt,
          completedAt: agentRun.completedAt,
        },
      });

      return agentRun;
    } catch (error) {
      this.logger.error(`Agent run failed: ${error}`);
      throw error;
    }
  }

  /**
   * Agent-Run fortsetzen nach Approval
   */
  async resumeRun(runId: string, approval: any): Promise<any> {
    try {
      const agentRun = await this.prismaService.client.agentRun.findUnique({
        where: { id: runId },
        include: { agent: true },
      });

      if (!agentRun) {
        throw new NotFoundException(`Agent run ${runId} not found`);
      }

      // Graph fortsetzen mit approved context
      const graph = this.graphService.createAgentGraph(
        agentRun.agentId,
        agentRun.agent.toolsConfig as string[],
      );

      // State aus DB laden oder neu erstellen
      const agentState: AgentState = {
        agentId: agentRun.agentId,
        tenantId: agentRun.agent.tenantId,
        userId: agentRun.userId || undefined,
        agentRunId: runId,
        systemPrompt: (agentRun.agent.personaConfig as any)?.instructions || undefined,
        availableTools: (agentRun.agent.toolsConfig as any) || [],
        input: agentRun.input,
        output: agentRun.output || undefined,
        messages: [],
        toolCalls: [],
        memory: {
          conversationHistory: [],
          longTermFacts: {},
          tokenCount: 0,
          maxTokens: 4000,
        },
        status: 'running',
        metrics: (agentRun.metrics as any) || {
          startTime: new Date(),
          tokenUsage: { prompt: 0, completion: 0, total: 0 },
          costUsd: 0,
          toolCallsCount: 0,
          retryCount: 0,
          kpiMetrics: {},
        },
        metadata: { approvalId: approval.id, approvedAction: approval.action },
      };

      const initialState = this.graphStateService.initializeState(agentState);

      // Graph ausführen
      const result = await this.graphService.executeGraph(graph, initialState);

      // Agent-Run aktualisieren
      await this.prismaService.client.agentRun.update({
        where: { id: runId },
        data: {
          status: 'completed',
          output: result.agentState.output || agentRun.output || '',
          completedAt: new Date(),
          metrics: result.agentState.metrics as any,
        },
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to resume agent run: ${error.message}`);
      throw error;
    }
  }

  /**
   * Agent-Run mit LangGraph ausführen
   */
  async runAgentWithGraph(agentId: string, input: string, userId?: string) {
    try {
      // Agent aus DB laden
      const agentData = await this.prismaService.client.agent.findUnique({
        where: { id: agentId },
      });

      if (!agentData) {
        throw new NotFoundException(`Agent ${agentId} not found`);
      }

      // Graph erstellen
      const graph = this.graphService.createAgentGraph(agentId, agentData.toolsConfig as string[]);

      // Agent-Run in DB erstellen
      const agentRun = await this.prismaService.client.agentRun.create({
        data: {
          agentId,
          userId,
          input,
          status: 'running',
          metrics: {} as any,
        },
      });

      // Initial State erstellen
      const agentState: AgentState & { systemPrompt?: string; availableTools?: any[]; agentRunId?: string } = {
        agentId,
        tenantId: agentData.tenantId,
        userId,
        agentRunId: agentRun.id,
        input,
        messages: [],
        toolCalls: [],
        memory: {
          conversationHistory: [],
          longTermFacts: {},
          tokenCount: 0,
          maxTokens: 4000,
        },
        status: 'running',
        systemPrompt: (agentData.personaConfig as any)?.instructions || undefined,
        availableTools: (agentData.toolsConfig as any) || [],
        metrics: {
          startTime: new Date(),
          tokenUsage: { prompt: 0, completion: 0, total: 0 },
          costUsd: 0,
          toolCallsCount: 0,
          retryCount: 0,
          kpiMetrics: {},
        },
        metadata: {},
      };

      const initialState = this.graphStateService.initializeState(agentState, input);

      // Graph ausführen
      const result = await this.graphService.executeGraph(graph, initialState);

      // Ergebnis verarbeiten
      const finalMessage = result.messages[result.messages.length - 1];
      const output = finalMessage?.content?.toString() || '';

      // Tool Calls zählen
      const toolCallsCount = Object.keys(result.toolResults).length;

      // Token Usage aus Agent State extrahieren
      const tokenUsage = result.agentState?.metrics?.tokenUsage || {
        prompt: 0,
        completion: 0,
        total: 0,
      };

      // Cost Tracking: LLM Usage für diesen Agent-Run abrufen
      const llmUsage = await this.prismaService.client.lLMUsage.findMany({
        where: {
          tenantId: agentData.tenantId,
          createdAt: {
            gte: agentRun.createdAt,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10, // Letzte 10 LLM-Aufrufe für diesen Run
      });

      // Cost aus LLM Usage berechnen
      const costUsd = llmUsage.reduce((sum: number, u: any) => sum + Number(u.costUsd), 0);

      // Agent-Run aktualisieren
      await this.prismaService.client.agentRun.update({
        where: { id: agentRun.id },
        data: {
          output,
          status: 'completed',
          completedAt: new Date(),
          metrics: {
            duration: Date.now() - agentRun.createdAt.getTime(),
            toolCallsCount,
            tokenUsage,
            costUsd,
            retryCount: result.agentState?.metrics?.retryCount || 0,
            kpiMetrics: result.agentState?.metrics?.kpiMetrics || {},
          } as any,
        },
      });

      this.logger.log(`Agent run completed: ${agentRun.id}`);

      return {
        id: agentRun.id,
        agentId: agentRun.agentId,
        userId: agentRun.userId,
        input: agentRun.input,
        output,
        status: 'completed' as const,
        metrics: {
          duration: Date.now() - agentRun.createdAt.getTime(),
          toolCallsCount,
        },
        createdAt: agentRun.createdAt,
        completedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Agent run with graph failed: ${error}`);
      throw error;
    }
  }

  /**
   * Agent-Config erstellen
   */
  private async createAgentConfig(agentData: any): Promise<AgentConfig> {
    return {
      agent: agentData,
      persona: agentData.personaConfig as any,
      policies: agentData.policiesConfig as any,
      kpi: agentData.kpiConfig as any,
      llmConfig: {
        provider: 'openai',
        model: 'gpt-4',
        fallbackProvider: 'anthropic',
        fallbackModel: 'claude-3-opus',
        temperature: 0.7,
        maxTokens: 2000,
      },
      memoryConfig: {
        maxTokens: 4000,
        compressionThreshold: 3000,
        longTermStorage: true,
      },
    };
  }

  /**
   * Agent-Run Status abrufen
   */
  async getRunStatus(runId: string) {
    const run = await this.prismaService.client.agentRun.findUnique({
      where: { id: runId },
    });

    if (!run) {
      throw new NotFoundException(`Run ${runId} not found`);
    }

    return run;
  }
}

