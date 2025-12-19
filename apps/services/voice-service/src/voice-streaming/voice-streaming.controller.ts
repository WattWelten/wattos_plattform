import { Controller, Post, Body, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { VoiceStreamingService } from './voice-streaming.service';

@Controller('api/v1/voice/conversation')
export class VoiceStreamingController {
  constructor(private readonly voiceStreamingService: VoiceStreamingService) {}

  @Post()
  @Header('Content-Type', 'application/json')
  async processVoiceConversation(
    @Body() body: { audioData: string; conversationId: string; language?: string },
    @Res() res: Response,
  ) {
    const { audioResponse, textResponse } = await this.voiceStreamingService.processVoiceConversation(
      body.audioData,
      body.conversationId,
      body.language,
    );

    res.json({
      audioData: audioResponse.toString('base64'),
      text: textResponse,
    });
  }

  @Post('stream')
  @Header('Content-Type', 'audio/mpeg')
  async streamVoiceConversation(
    @Body() body: { audioData: string; conversationId: string; language?: string },
    @Res() res: Response,
  ) {
    const { audioResponse } = await this.voiceStreamingService.processVoiceConversation(
      body.audioData,
      body.conversationId,
      body.language,
    );

    res.send(audioResponse);
  }
}














