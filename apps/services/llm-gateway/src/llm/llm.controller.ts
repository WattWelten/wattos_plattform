import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChatCompletionRequestDto } from './dto/chat-completion-request.dto';
import { CompletionRequestDto } from './dto/completion-request.dto';
import { LlmService } from './llm.service';

@Controller({ path: 'v1' })
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('chat/completions')
  async createChatCompletion(
    @Body() body: ChatCompletionRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (body.stream) {
      return this.handleStream(body, res);
    }
    return this.llmService.createChatCompletion(body);
  }

  @Post('completions')
  async createCompletion(@Body() body: CompletionRequestDto) {
    return this.llmService.createCompletion(body);
  }

  @Get('providers')
  async listProviders() {
    return this.llmService.listProviders();
  }

  private async handleStream(request: ChatCompletionRequestDto, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await this.llmService.streamChatCompletion(request);
    try {
      for await (const chunk of stream) {
        res.write('data: ' + JSON.stringify(chunk) + '\n\n');
      }
      res.write('data: [DONE]\n\n');
    } catch (error) {
      const payload = { message: (error as Error).message };
      res.write('event: error\ndata: ' + JSON.stringify(payload) + '\n\n');
    } finally {
      res.end();
    }
  }
}
