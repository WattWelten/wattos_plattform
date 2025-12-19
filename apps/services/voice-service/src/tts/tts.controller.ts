import { Controller, Post, Body, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { TtsService } from './tts.service';
import { TextToSpeechDto } from './dto/text-to-speech.dto';

@Controller('api/v1/voice/tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @Post()
  @Header('Content-Type', 'audio/mpeg')
  async textToSpeech(@Body() dto: TextToSpeechDto, @Res() res: Response) {
    const audioBuffer = await this.ttsService.textToSpeech(dto);
    res.send(audioBuffer);
  }

  @Post('stream')
  @Header('Content-Type', 'audio/mpeg')
  async streamTextToSpeech(@Body() dto: TextToSpeechDto, @Res() res: Response) {
    const audioStream = await this.ttsService.streamTextToSpeech(dto);
    audioStream.pipe(res);
  }
}














