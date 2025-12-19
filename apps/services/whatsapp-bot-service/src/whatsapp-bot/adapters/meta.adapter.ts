import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Meta WhatsApp Business API Adapter
 * 
 * Adapter für Meta WhatsApp Business API
 */
@Injectable()
export class MetaWhatsAppAdapter {
  private readonly logger = new Logger(MetaWhatsAppAdapter.name);
  private readonly apiVersion = 'v18.0';
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly verifyToken: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.phoneNumberId = this.configService.get<string>('META_WHATSAPP_PHONE_NUMBER_ID') || '';
    this.accessToken = this.configService.get<string>('META_WHATSAPP_ACCESS_TOKEN') || '';
    this.verifyToken = this.configService.get<string>('META_WHATSAPP_VERIFY_TOKEN') || 'wattweiser-verify-token';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;

    if (this.phoneNumberId && this.accessToken) {
      this.logger.log('Meta WhatsApp adapter initialized');
    } else {
      this.logger.warn('Meta WhatsApp credentials not configured');
    }
  }

  /**
   * Webhook-Verifizierung (GET)
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('Webhook verified');
      return challenge;
    }
    return null;
  }

  /**
   * Nachricht senden
   */
  async sendMessage(to: string, message: string): Promise<string> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error('Meta WhatsApp not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/messages`,
          {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: {
              body: message,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const messageId = response.data.messages[0]?.id;
      this.logger.debug(`Message sent: ${messageId} to ${to}`);
      return messageId;
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Media-Nachricht senden
   */
  async sendMedia(to: string, mediaUrl: string, mediaType: 'image' | 'video' | 'document'): Promise<string> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error('Meta WhatsApp not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/messages`,
          {
            messaging_product: 'whatsapp',
            to,
            type: mediaType,
            [mediaType]: {
              link: mediaUrl,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const messageId = response.data.messages[0]?.id;
      this.logger.debug(`Media message sent: ${messageId} to ${to}`);
      return messageId;
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp media: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Template-Message senden
   */
  async sendTemplate(to: string, templateName: string, languageCode: string = 'de'): Promise<string> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error('Meta WhatsApp not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/messages`,
          {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: languageCode,
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const messageId = response.data.messages[0]?.id;
      this.logger.debug(`Template message sent: ${messageId} to ${to}`);
      return messageId;
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Interactive Message senden (Buttons, Lists)
   */
  async sendInteractive(
    to: string,
    body: string,
    buttons: Array<{ id: string; title: string }>,
  ): Promise<string> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error('Meta WhatsApp not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/messages`,
          {
            messaging_product: 'whatsapp',
            to,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: {
                text: body,
              },
              action: {
                buttons: buttons.map((btn) => ({
                  type: 'reply',
                  reply: {
                    id: btn.id,
                    title: btn.title,
                  },
                })),
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const messageId = response.data.messages[0]?.id;
      this.logger.debug(`Interactive message sent: ${messageId} to ${to}`);
      return messageId;
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp interactive: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.phoneNumberId || !this.accessToken) {
      return false;
    }

    try {
      // Prüfe API-Verfügbarkeit
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}`, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}

