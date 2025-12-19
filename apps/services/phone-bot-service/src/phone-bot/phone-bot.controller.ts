import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PhoneBotService } from './phone-bot.service';
import { TwilioAdapter } from './adapters/twilio.adapter';
import { ChannelRouterService } from '@wattweiser/core';
import { ChannelMessage, ChannelSessionConfig } from '@wattweiser/core';

/**
 * Phone-Bot Controller
 * 
 * Webhook-Endpoints für Twilio Voice API
 */
@Controller('api/v1/phone-bot')
export class PhoneBotController {
  constructor(
    private readonly phoneBotService: PhoneBotService,
    private readonly twilioAdapter: TwilioAdapter,
    private readonly channelRouter: ChannelRouterService,
  ) {}

  /**
   * Incoming Call Webhook
   */
  @Post('webhook/incoming')
  @HttpCode(HttpStatus.OK)
  async handleIncomingCall(@Req() req: Request, @Res() res: Response) {
    const callSid = req.body.CallSid;
    const from = req.body.From;
    const to = req.body.To;

    this.phoneBotService.logger.debug(`Incoming call webhook`, { callSid, from, to });

    // Session erstellen
    const session = await this.channelRouter.createSession('phone', {
      tenantId: 'default', // TODO: Aus Request extrahieren
      channelId: callSid,
      metadata: {
        from,
        to,
      },
    });

    // TwiML Response generieren
    const twiml = await this.twilioAdapter.handleIncomingCall(callSid, from, to);

    res.type('text/xml');
    res.send(twiml);
  }

  /**
   * Gather Webhook (Speech/DTMF Input)
   */
  @Post('webhook/gather/:callSid')
  @HttpCode(HttpStatus.OK)
  async handleGather(
    @Param('callSid') callSid: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const speechResult = req.body.SpeechResult;
    const digits = req.body.Digits;

    this.phoneBotService.logger.debug(`Gather webhook`, { callSid, speechResult, digits });

    const session = this.phoneBotService.getSessionByCallSid(callSid);
    if (!session) {
      res.type('text/xml');
      res.send('<Response><Say>Session not found</Say><Hangup/></Response>');
      return;
    }

    // Nachricht verarbeiten
    if (speechResult) {
      await this.channelRouter.receiveMessage('phone', session.id, {
        text: speechResult,
        metadata: {
          source: 'speech',
        },
      });
    } else if (digits) {
      await this.channelRouter.receiveMessage('phone', session.id, {
        text: digits,
        metadata: {
          source: 'dtmf',
        },
      });
    }

    // TwiML Response (weitere Eingabe oder Hangup)
    const twiml = new (await import('twilio')).twiml.VoiceResponse();
    twiml.say('Vielen Dank für Ihren Anruf. Auf Wiedersehen!');
    twiml.hangup();

    res.type('text/xml');
    res.send(twiml.toString());
  }

  /**
   * Call Status Webhook
   */
  @Post('webhook/status')
  @HttpCode(HttpStatus.OK)
  async handleStatus(@Req() req: Request) {
    const callSid = req.body.CallSid;
    const callStatus = req.body.CallStatus;

    this.phoneBotService.logger.debug(`Call status webhook`, { callSid, callStatus });

    const session = this.phoneBotService.getSessionByCallSid(callSid);
    if (session && (callStatus === 'completed' || callStatus === 'failed')) {
      await this.channelRouter.closeSession('phone', session.id);
    }
  }

  /**
   * Session abrufen
   */
  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    const session = await this.phoneBotService.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session;
  }

  /**
   * Call beenden
   */
  @Post('sessions/:sessionId/hangup')
  async hangup(@Param('sessionId') sessionId: string) {
    await this.channelRouter.closeSession('phone', sessionId);
    return { success: true };
  }
}

