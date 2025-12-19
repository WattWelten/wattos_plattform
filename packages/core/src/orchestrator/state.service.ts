import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../events/bus.service';
import { Event } from '../events/types';

/**
 * Session State
 */
export interface SessionState {
  sessionId: string;
  tenantId: string;
  userId?: string;
  state: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

/**
 * State Management Service
 * 
 * Verwaltet Session-States für Agent-Orchestrierung
 */
@Injectable()
export class StateService {
  private readonly logger = new Logger(StateService.name);
  private states: Map<string, SessionState> = new Map();
  private stateHistory: Map<string, Event[]> = new Map();

  constructor(private readonly eventBus: EventBusService) {
    // Subscribe zu Events für State-Updates
    this.eventBus.subscribe('*.*', async (event: Event) => {
      await this.updateStateFromEvent(event);
    });
  }

  /**
   * Session State erstellen
   */
  createState(sessionId: string, tenantId: string, userId?: string): SessionState {
    const state: SessionState = {
      sessionId,
      tenantId,
      userId,
      state: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.states.set(sessionId, state);
    this.stateHistory.set(sessionId, []);
    this.logger.debug(`State created for session: ${sessionId}`);

    return state;
  }

  /**
   * Session State abrufen
   */
  getState(sessionId: string): SessionState | undefined {
    return this.states.get(sessionId);
  }

  /**
   * Session State aktualisieren
   */
  updateState(sessionId: string, updates: Record<string, any>): SessionState | null {
    const state = this.states.get(sessionId);
    if (!state) {
      this.logger.warn(`State not found for session: ${sessionId}`);
      return null;
    }

    state.state = { ...state.state, ...updates };
    state.updatedAt = Date.now();
    this.states.set(sessionId, state);

    this.logger.debug(`State updated for session: ${sessionId}`);
    return state;
  }

  /**
   * Session State löschen
   */
  deleteState(sessionId: string): void {
    this.states.delete(sessionId);
    this.stateHistory.delete(sessionId);
    this.logger.debug(`State deleted for session: ${sessionId}`);
  }

  /**
   * State aus Event aktualisieren
   */
  private async updateStateFromEvent(event: Event): Promise<void> {
    const state = this.getState(event.sessionId);
    if (!state) {
      // Erstelle State falls nicht vorhanden
      this.createState(event.sessionId, event.tenantId, event.userId);
    }

    // Speichere Event in History
    const history = this.stateHistory.get(event.sessionId) || [];
    history.push(event);
    this.stateHistory.set(event.sessionId, history);

    // Update State basierend auf Event-Type
    const updates: Record<string, any> = {
      lastEvent: event.type,
      lastEventTime: event.timestamp,
    };

    // Domain-spezifische Updates
    switch (event.domain) {
      case 'intent':
        if ('payload' in event && 'intent' in event.payload) {
          updates.lastIntent = event.payload.intent;
        }
        break;
      case 'tool':
        if ('payload' in event && 'toolName' in event.payload) {
          updates.lastTool = event.payload.toolName;
        }
        break;
    }

    this.updateState(event.sessionId, updates);
  }

  /**
   * Event-History abrufen
   */
  getEventHistory(sessionId: string): Event[] {
    return this.stateHistory.get(sessionId) || [];
  }

  /**
   * State zurücksetzen
   */
  resetState(sessionId: string): void {
    const state = this.getState(sessionId);
    if (state) {
      state.state = {};
      state.updatedAt = Date.now();
      this.states.set(sessionId, state);
      this.logger.debug(`State reset for session: ${sessionId}`);
    }
  }

  /**
   * Alle States auflisten
   */
  listStates(): SessionState[] {
    return Array.from(this.states.values());
  }

  /**
   * States nach Tenant filtern
   */
  getStatesByTenant(tenantId: string): SessionState[] {
    return Array.from(this.states.values()).filter((state) => state.tenantId === tenantId);
  }
}

