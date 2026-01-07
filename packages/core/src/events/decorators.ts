import { SetMetadata } from '@nestjs/common';

/**
 * Metadata Key für Event-Handler
 */
export const EVENT_HANDLER_METADATA = 'event:handler';

/**
 * Event-Handler Decorator
 * 
 * Markiert eine Methode als Event-Handler
 * 
 * @example
 * ```typescript
 * @EventHandler('perception.audio.received')
 * async handleAudioReceived(event: PerceptionEvent) {
 *   // Handle event
 * }
 * ```
 */
export const EventHandler = (eventType: string) => SetMetadata(EVENT_HANDLER_METADATA, eventType);

/**
 * Event-Emitter Decorator
 * 
 * Injiziert EventBusService in eine Klasse
 * 
 * @example
 * ```typescript
 * @EventEmitter()
 * export class MyService {
 *   constructor(private readonly eventBus: EventBusService) {}
 * }
 * ```
 */
export const EventEmitter = () => SetMetadata('event:emitter', true);

