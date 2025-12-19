import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

/**
 * Twilio Adapter
 * 
 * Adapter für Twilio Voice API
 */
@Injectable()
export class TwilioAdapter {
  private readonly logger = new Logger(TwilioAdapter.name);
  private client: twilio.Twilio;
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly phoneNumber: string;

  constructor(private readonly configService: ConfigService) {
    this.accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID') || '';
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.phoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
      this.logger.log('Twilio client initialized');
    } else {
      this.logger.warn('Twilio credentials not configured');
    }
  }

  /**
   * Incoming Call Webhook verarbeiten
   */
  async handleIncomingCall(callSid: string, from: string, to: string): Promise<string> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    this.logger.debug(`Incoming call: ${callSid} from ${from} to ${to}`);

    // TwiML für Call-Response generieren
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Gather für DTMF (optional)
    const gather = twiml.gather({
      input: 'speech dtmf',
      timeout: 10,
      speechTimeout: 'auto',
      action: `/api/v1/phone-bot/webhook/gather/${callSid}`,
      method: 'POST',
    });

    gather.say(
      {
        voice: 'alice',
        language: 'de-DE',
      },
      'Hallo, wie kann ich Ihnen helfen?',
    );

    // Fallback wenn keine Eingabe
    twiml.redirect({
      method: 'POST',
    }, `/api/v1/phone-bot/webhook/gather/${callSid}`);

    return twiml.toString();
  }

  /**
   * Audio-Stream starten
   */
  async startStream(callSid: string, streamUrl: string): Promise<void> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    try {
      await this.client.calls(callSid).streams.create({
        url: streamUrl,
        name: 'audio-stream',
      });

      this.logger.debug(`Stream started for call: ${callSid}`);
    } catch (error: any) {
      this.logger.error(`Failed to start stream: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Call beenden
   */
  async hangupCall(callSid: string): Promise<void> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    try {
      await this.client.calls(callSid).update({ status: 'completed' });
      this.logger.debug(`Call hung up: ${callSid}`);
    } catch (error: any) {
      this.logger.error(`Failed to hangup call: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Call-Status abrufen
   */
  async getCallStatus(callSid: string): Promise<string> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    try {
      const call = await this.client.calls(callSid).fetch();
      return call.status;
    } catch (error: any) {
      this.logger.error(`Failed to get call status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Prüfe Account-Status
      const account = await this.client.api.accounts(this.accountSid).fetch();
      return account.status === 'active';
    } catch {
      return false;
    }
  }
}

