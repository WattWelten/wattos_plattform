import { Controller, Post, Body } from '@nestjs/common';
import { SttService } from './stt.service';
import { SpeechToTextDto } from './dto/speech-to-text.dto';

@Controller('api/v1/voice/stt')
export class SttController {
  constructor(private readonly sttService: SttService) {}

  @Post()
  async speechToText(@Body() dto: SpeechToTextDto) {
    const text = await this.sttService.speechToText({
      audioData: dto.audioData,
      language: dto.language,
      prompt: dto.prompt,
    });
    return { text };
  }
}














