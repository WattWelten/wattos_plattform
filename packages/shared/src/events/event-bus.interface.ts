import type { Event } from './types';

/**
 * Event Handler Type
 */
export type EventHandler = (event: Event) => void | Promise<void>;

/**
 * Event Bus Interface
 * 
 * Definiert die Schnittstelle für Event-Bus-Services
 * zur Vermeidung von zyklischen Abhängigkeiten
 */
export interface IEventBusService {
  /**
   * Event emittieren
   */
  emit(event: Event): Promise<void>;

  /**
   * Event abonnieren
   */
  subscribe(eventType: string, handler: EventHandler): void;

  /**
   * Health Check
   */
  healthCheck(): Promise<boolean>;
}

