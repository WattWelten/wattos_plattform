import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WhatsAppBotService } from './whatsapp-bot.service';
import { MetaWhatsAppAdapter } from './adapters/meta.adapter';
import { ChannelRouterService } from '@wattweiser/core';
import { ChannelMessage, ChannelSessionConfig } from '@wattweiser/core';

/**
 * WhatsApp-Bot Controller
 * 
 * Webhook-Endpoints für Meta WhatsApp Business API
 */
@Controller('api/v1/whatsapp-bot')
export class WhatsAppBotController {
  constructor(
    private readonly whatsappBotService: WhatsAppBotService,
    private readonly metaAdapter: MetaWhatsAppAdapter,
    private readonly channelRouter: ChannelRouterService,
  ) {}

  /**
   * Webhook-Verifizierung (GET)
   */
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.metaAdapter.verifyWebhook(mode, token, challenge);
    if (result) {
      res.status(HttpStatus.OK).send(result);
    } else {
      res.status(HttpStatus.FORBIDDEN).send('Verification failed');
    }
  }

  /**
   * Webhook für eingehende Nachrichten (POST)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: Request) {
    const body = req.body;

    // Webhook-Event verarbeiten
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.value?.messages) {
            for (const message of change.value.messages) {
              await this.handleIncomingMessage(message, change.value.contacts?.[0]);
            }
          }
        }
      }
    }
  }

  /**
   * Eingehende Nachricht verarbeiten
   */
  private async handleIncomingMessage(message: any, contact: any) {
    const from = message.from;
    const messageType = message.type;
    const messageId = message.id;

    this.whatsappBotService.logger.debug(`Incoming WhatsApp message`, {
      from,
      type: messageType,
      messageId,
    });

    // Session erstellen oder abrufen
    let session = this.whatsappBotService.getSessionByPhoneNumber(from);
    if (!session) {
      session = await this.channelRouter.createSession('whatsapp', {
        tenantId: 'default', // TODO: Aus Request extrahieren
        channelId: from,
        metadata: {
          contactName: contact?.profile?.name,
        },
      });
    }

    // Nachricht extrahieren
    const channelMessage: ChannelMessage = {
      text: message.text?.body || message.button?.text || undefined,
      media: message.image || message.video || message.document
        ? {
            type: messageType,
            url: message[messageType]?.id,
            metadata: {
              messageId,
              caption: message[messageType]?.caption,
            },
          }
        : undefined,
      metadata: {
        messageId,
        messageType,
        timestamp: message.timestamp,
      },
    };

    // Nachricht verarbeiten
    await this.channelRouter.receiveMessage('whatsapp', session.id, channelMessage);
  }

  /**
   * Session erstellen
   */
  @Post('sessions')
  async createSession(@Body() config: ChannelSessionConfig) {
    return await this.channelRouter.createSession('whatsapp', config);
  }

  /**
   * Session abrufen
   */
  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    const session = await this.whatsappBotService.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session;
  }

  /**
   * Nachricht senden
   */
  @Post('sessions/:sessionId/messages')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() message: ChannelMessage,
  ) {
    return await this.channelRouter.sendMessage('whatsapp', sessionId, message);
  }

  /**
   * Template-Message senden
   */
  @Post('sessions/:sessionId/templates')
  async sendTemplate(
    @Param('sessionId') sessionId: string,
    @Body() body: { templateName: string; languageCode?: string },
  ) {
    const messageId = await this.whatsappBotService.sendTemplate(
      sessionId,
      body.templateName,
      body.languageCode || 'de',
    );
    return { messageId, success: true };
  }

  /**
   * Interactive Message senden
   */
  @Post('sessions/:sessionId/interactive')
  async sendInteractive(
    @Param('sessionId') sessionId: string,
    @Body() body: { text: string; buttons: Array<{ id: string; title: string }> },
  ) {
    const messageId = await this.whatsappBotService.sendInteractive(
      sessionId,
      body.text,
      body.buttons,
    );
    return { messageId, success: true };
  }

  /**
   * Session schließen
   */
  @Post('sessions/:sessionId/close')
  async closeSession(@Param('sessionId') sessionId: string) {
    await this.channelRouter.closeSession('whatsapp', sessionId);
    return { success: true };
  }
}

