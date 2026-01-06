import { Injectable, Logger } from '@nestjs/common';
import { StateGraph, END, START } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GraphState, GraphStateService } from './graph-state.service';
import { AgentState, ToolCall } from '@wattweiser/agents';
import { ServiceDiscoveryService } from '@wattweiser/shared';
import { PrismaService } from '@wattweiser/db';

/**
 * Graph Service
 * Erstellt und verwaltet LangGraph-Workflows für Agenten
 */
@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);
  private graphs: Map<string, StateGraph<GraphState>> = new Map();

  constructor(
    private readonly graphStateService: GraphStateService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Graph für Agent erstellen
   */
  createAgentGraph(agentId: string, tools: any[]): StateGraph<GraphState> {
    if (this.graphs.has(agentId)) {
      return this.graphs.get(agentId)!;
    }

    const graph = new StateGraph<GraphState>({
      channels: {
        messages: {
          reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
          default: () => [],
        },
        agentState: {
          reducer: (x: AgentState, y: AgentState) => ({ ...x, ...y }),
          default: () => ({} as AgentState),
        },
        toolResults: {
          reducer: (x: Record<string, any>, y: Record<string, any>) => ({ ...x, ...y }),
          default: () => ({}),
        },
        next: {
          reducer: (x: string[], y: string[]) => x.concat(y),
          default: () => [],
        },
      },
    });

    // Nodes hinzufügen
    graph.addNode('llm', this.llmNode.bind(this));
    graph.addNode('tools', this.toolsNode.bind(this));
    graph.addNode('router', this.routerNode.bind(this));

    // Edges hinzufügen
    graph.addEdge(START, 'llm');
    graph.addEdge('llm', 'router');
    graph.addConditionalEdges('router', this.shouldContinue.bind(this), {
      continue: 'tools',
      end: END,
    });
    graph.addEdge('tools', 'llm');

    // Graph kompilieren
    const compiledGraph = graph.compile();
    this.graphs.set(agentId, compiledGraph as any);

    return compiledGraph as any;
  }

  /**
   * Graph ausführen
   */
  async executeGraph(
    graph: StateGraph<GraphState>,
    initialState: GraphState,
  ): Promise<GraphState> {
    try {
      const result = await graph.invoke(initialState);
      return result;
    } catch (error) {
      this.logger.error(`Graph execution failed: ${error}`);
      throw error;
    }
  }

  /**
   * LLM Node
   */
  private async llmNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);
      
      // Messages für LLM-Gateway formatieren
      const llmMessages = state.messages.map((msg) => ({
        role: msg instanceof HumanMessage ? 'user' : msg instanceof SystemMessage ? 'system' : 'assistant',
        content: msg.content as string,
      }));

      // Tool Results als Messages hinzufügen
      if (Object.keys(state.toolResults).length > 0) {
        const toolResultsMessage = `Tool Results: ${JSON.stringify(state.toolResults)}`;
        llmMessages.push({
          role: 'user',
          content: toolResultsMessage,
        });
      }

      // LLM-Gateway aufrufen
      const response = await firstValueFrom(
        this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
          model: 'gpt-4',
          messages: llmMessages,
          tools: state.agentState.availableTools || [],
          stream: false,
        }),
      );

      const aiMessage = new AIMessage(response.data.choices[0]?.message?.content || '');

      // Tool Calls extrahieren (falls vorhanden)
      if (response.data.choices[0]?.message?.tool_calls) {
        (aiMessage as any).tool_calls = response.data.choices[0].message.tool_calls;
      }

      // Token Usage extrahieren aus Response
      const usage = response.data.usage || {};
      const tokenUsage = {
        prompt: usage.prompt_tokens || 0,
        completion: usage.completion_tokens || 0,
        total: usage.total_tokens || 0,
      };

      // Agent State mit Token Usage aktualisieren
      const updatedAgentState = {
        ...state.agentState,
        metrics: {
          ...state.agentState.metrics,
          tokenUsage: {
            prompt: (state.agentState.metrics?.tokenUsage?.prompt || 0) + tokenUsage.prompt,
            completion: (state.agentState.metrics?.tokenUsage?.completion || 0) + tokenUsage.completion,
            total: (state.agentState.metrics?.tokenUsage?.total || 0) + tokenUsage.total,
          },
        },
      };

      return {
        messages: [aiMessage],
        agentState: updatedAgentState,
        tokenUsage, // Für Cost Tracking
      };
    } catch (error: any) {
      this.logger.error(`LLM node failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tools Node
   */
  private async toolsNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      const lastMessage = state.messages[state.messages.length - 1];
      const toolResults: Record<string, any> = {};

      // Tool Calls aus Message extrahieren
      if (lastMessage && 'tool_calls' in lastMessage) {
        const toolCalls = (lastMessage as any).tool_calls || [];

        for (const toolCall of toolCalls) {
          try {
            // Tool über Tool-Service ausführen
            const result = await this.executeTool(toolCall);
            toolResults[toolCall.id] = result;

            // Tool Call in DB speichern
            await this.saveToolCall(state.agentState.agentRunId, toolCall, result);
          } catch (error: any) {
            this.logger.error(`Tool execution failed: ${error.message}`);
            toolResults[toolCall.id] = { error: error.message };
          }
        }
      }

      return {
        toolResults,
      };
    } catch (error: any) {
      this.logger.error(`Tools node failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tool Call in DB speichern
   */
  private async saveToolCall(agentRunId: string, toolCall: any, result: any) {
    try {
      await this.prismaService.client.toolCall.create({
        data: {
          agentRunId,
          toolName: toolCall.function?.name || toolCall.name,
          input: toolCall.function?.arguments || toolCall.input || {},
          output: result,
        },
      });
    } catch (error: any) {
      this.logger.warn(`Failed to save tool call: ${error.message}`);
    }
  }

  /**
   * Router Node
   */
  private async routerNode(state: GraphState): Promise<Partial<GraphState>> {
    const lastMessage = state.messages[state.messages.length - 1];
    const hasToolCalls = lastMessage && 'tool_calls' in lastMessage && (lastMessage as any).tool_calls?.length > 0;

    return {
      next: hasToolCalls ? ['continue'] : ['end'],
    };
  }

  /**
   * Should Continue (Conditional Edge)
   */
  private shouldContinue(state: GraphState): string {
    if (state.next.includes('end')) {
      return 'end';
    }
    return 'continue';
  }

  /**
   * Tool ausführen
   */
  private async executeTool(toolCall: any): Promise<any> {
    try {
      const toolServiceUrl = this.serviceDiscovery.getServiceUrl('tool-service', 3005);
      const toolName = toolCall.function?.name || toolCall.name;
      const toolInput = toolCall.function?.arguments 
        ? (typeof toolCall.function.arguments === 'string' 
            ? JSON.parse(toolCall.function.arguments) 
            : toolCall.function.arguments)
        : toolCall.input || {};

      this.logger.debug(`Executing tool: ${toolName} with input: ${JSON.stringify(toolInput)}`);

      // Tool über Tool-Service ausführen
      // Tool-ID aus Tool-Name ableiten (vereinfacht)
      const toolId = toolName; // Annahme: toolName entspricht toolId
      
      const response = await firstValueFrom(
        this.httpService.post(`${toolServiceUrl}/tools/execute`, {
          toolId,
          input: toolInput,
        }),
      );

      return response.data.result || response.data;
    } catch (error: any) {
      this.logger.error(`Tool execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Graph löschen
   */
  removeGraph(agentId: string): void {
    this.graphs.delete(agentId);
  }
}


