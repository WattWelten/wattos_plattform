import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../events/bus.service';
import { Agent } from '../orchestrator/runtime.service';
import {
  Event,
  EventDomain,
  PerceptionEvent,
  PerceptionEventSchema,
  IntentEvent,
  AvatarEvent,
  AvatarEventSchema,
} from '../events/types';
import { AsrService } from '../multimodal/voice/asr.service';
import { TtsService } from '../multimodal/voice/tts.service';
import { AvatarV2Service } from '../multimodal/avatar/avatar-v2.service';
import { v4 as uuid } from 'uuid';

/**
 * Media Agent
 * 
 * Verarbeitet Perception- und Avatar-Events, koordiniert ASR/TTS, Avatar-Animationen
 */
@Injectable()
export class MediaAgent implements Agent {
  readonly name = 'media-agent';
  readonly version = '1.0.0';
  private readonly logger = new Logger(MediaAgent.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly asrService: AsrService,
    private readonly ttsService: TtsService,
    private readonly avatarV2Service: AvatarV2Service,
  ) {}

  /**
   * Event verarbeiten
   */
  async handle(event: Event): Promise<Event | null> {
    // Perception- oder Avatar-Events verarbeiten
    if (event.domain === EventDomain.PERCEPTION) {
      return await this.handlePerceptionEvent(event);
    } else if (event.domain === EventDomain.AVATAR) {
      return await this.handleAvatarEvent(event);
    }

    return null;
  }

  /**
   * Perception-Event verarbeiten
   */
  private async handlePerceptionEvent(event: Event): Promise<Event | null> {
    try {
      const perceptionEvent = PerceptionEventSchema.parse(event);
      this.logger.debug(`Processing perception event: ${perceptionEvent.action}`, {
        sessionId: perceptionEvent.sessionId,
        tenantId: perceptionEvent.tenantId,
      });

      switch (perceptionEvent.action) {
        case 'audio.received':
          return await this.handleAudioReceived(perceptionEvent);
        case 'video.received':
          return await this.handleVideoReceived(perceptionEvent);
        case 'text.received':
          return await this.handleTextReceived(perceptionEvent);
        default:
          this.logger.warn(`Unknown perception action: ${perceptionEvent.action}`);
          return null;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing perception event: ${errorMessage}`, errorStack);
      return null;
    }
  }

  /**
   * Audio empfangen (ASR)
   */
  private async handleAudioReceived(event: PerceptionEvent): Promise<Event | null> {
    const { sessionId, tenantId, payload } = event;
    const audioData = payload.data;

    this.logger.debug(`Processing audio: ${payload.format}`);

    try {
      // ASR durchführen
      const transcription = await this.asrService.transcribe(
        audioData instanceof Buffer ? audioData : Buffer.from(audioData as string),
        {
          language: payload.language || 'de',
          format: payload.format,
        },
      );

      // Intent-Event emittieren (Text wurde erkannt)
      const intentEvent: IntentEvent = {
        id: uuid(),
        type: `${EventDomain.INTENT}.message.processed`,
        domain: EventDomain.INTENT,
        action: 'message.processed',
        timestamp: Date.now(),
        sessionId,
        tenantId,
        userId: event.userId,
        payload: {
          message: transcription.text,
          confidence: transcription.confidence,
        },
        metadata: {
          agent: this.name,
          version: this.version,
          source: 'asr',
        },
      };

      await this.eventBus.emit(intentEvent);

      return intentEvent;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`ASR failed: ${errorMessage}`, errorStack);
      return null;
    }
  }

  /**
   * Video empfangen
   */
  private async handleVideoReceived(event: PerceptionEvent): Promise<Event | null> {
    // TODO: Video-Processing (z.B. Frame-Analyse)
    this.logger.debug('Video received (not yet implemented)');
    return null;
  }

  /**
   * Text empfangen
   */
  private async handleTextReceived(event: PerceptionEvent): Promise<Event | null> {
    const { sessionId, tenantId, payload } = event;
    const text = payload.data as string;

    // Weiterleiten als Intent-Event
    const intentEvent: IntentEvent = {
      id: uuid(),
      type: `${EventDomain.INTENT}.message.processed`,
      domain: EventDomain.INTENT,
      action: 'message.processed',
      timestamp: Date.now(),
      sessionId,
      tenantId,
      userId: event.userId,
      payload: {
        message: text,
      },
      metadata: {
        agent: this.name,
        version: this.version,
        source: 'text',
      },
    };

    await this.eventBus.emit(intentEvent);

    return intentEvent;
  }

  /**
   * Avatar-Event verarbeiten
   */
  private async handleAvatarEvent(event: Event): Promise<Event | null> {
    try {
      const avatarEvent = AvatarEventSchema.parse(event);
      this.logger.debug(`Processing avatar event: ${avatarEvent.action}`, {
        sessionId: avatarEvent.sessionId,
        tenantId: avatarEvent.tenantId,
      });

      switch (avatarEvent.action) {
        case 'animation.started':
          return await this.handleAnimationStarted(avatarEvent);
        case 'animation.completed':
          return await this.handleAnimationCompleted(avatarEvent);
        case 'lip-sync.updated':
          return await this.handleLipSyncUpdated(avatarEvent);
        default:
          this.logger.warn(`Unknown avatar action: ${avatarEvent.action}`);
          return null;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing avatar event: ${errorMessage}`, errorStack);
      return null;
    }
  }

  /**
   * Animation gestartet
   */
  private async handleAnimationStarted(event: AvatarEvent): Promise<Event | null> {
    this.logger.debug(`Avatar animation started: ${event.payload.animationType}`);
    return event;
  }

  /**
   * Animation abgeschlossen
   */
  private async handleAnimationCompleted(event: AvatarEvent): Promise<Event | null> {
    this.logger.debug(`Avatar animation completed: ${event.payload.animationType}`);
    return event;
  }

  /**
   * Lip-Sync aktualisiert
   */
  private async handleLipSyncUpdated(event: AvatarEvent): Promise<Event | null> {
    // Lip-Sync wurde aktualisiert, Event weiterleiten
    return event;
  }

  /**
   * TTS für Avatar generieren
   */
  async generateTTSForAvatar(text: string, voiceId?: string): Promise<Buffer> {
    try {
      const audio = await this.ttsService.synthesize(text, {
        voiceId: voiceId || 'default',
        language: 'de',
      });

      return audio.audioData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`TTS generation failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const checks = await Promise.all([
        this.asrService.healthCheck(),
        this.ttsService.healthCheck(),
      ]);

      return checks.every((check) => check === true);
    } catch {
      return false;
    }
  }
}

