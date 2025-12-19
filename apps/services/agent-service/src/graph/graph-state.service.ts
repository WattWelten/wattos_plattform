import { Injectable } from '@nestjs/common';
import { StateGraph, END, START } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { AgentState } from '@wattweiser/agents';

/**
 * Graph State für LangGraph
 */
export interface GraphState {
  messages: BaseMessage[];
  agentState: AgentState;
  toolResults: Record<string, any>;
  next: string[];
}

/**
 * Graph State Service
 * Verwaltet den State für LangGraph-Workflows
 */
@Injectable()
export class GraphStateService {
  /**
   * State initialisieren
   */
  initializeState(agentState: AgentState, initialInput?: string): GraphState {
    const messages: BaseMessage[] = [];

    // System-Message aus Agent-Config
    if (agentState.systemPrompt) {
      messages.push(new SystemMessage(agentState.systemPrompt));
    }

    // Initiale User-Input
    if (initialInput) {
      messages.push(new HumanMessage(initialInput));
    }

    return {
      messages,
      agentState,
      toolResults: {},
      next: [],
    };
  }

  /**
   * State aktualisieren
   */
  updateState(currentState: GraphState, updates: Partial<GraphState>): GraphState {
    return {
      ...currentState,
      ...updates,
      // Messages zusammenführen
      messages: updates.messages ? [...currentState.messages, ...updates.messages] : currentState.messages,
      // Tool Results zusammenführen
      toolResults: { ...currentState.toolResults, ...(updates.toolResults || {}) },
    };
  }

  /**
   * Messages zu BaseMessage konvertieren
   */
  convertToBaseMessages(messages: any[]): BaseMessage[] {
    return messages.map((msg) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content || '');
      } else if (msg.role === 'assistant') {
        return new AIMessage(msg.content || '');
      } else if (msg.role === 'system') {
        return new SystemMessage(msg.content || '');
      } else {
        return new HumanMessage(JSON.stringify(msg));
      }
    });
  }
}


