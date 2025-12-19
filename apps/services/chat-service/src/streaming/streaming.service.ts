import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { SendMessageDto } from '../chat/dto/send-message.dto';
import { PrismaClient } from '@wattweiser/db';
import { ServiceDiscoveryService } from '@wattweiser/shared';

/**
 * Streaming Service
 * Handles Server-Sent Events (SSE) für Chat-Streaming
 */
@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);
  private prisma: PrismaClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Chat-Message streamen
   */
  streamChatMessage(chatId: string, dto: SendMessageDto): Observable<any> {
    return new Observable((subscriber) => {
      this.streamLLMResponse(chatId, dto, subscriber)
        .then(() => {
          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });
    });
  }

  /**
   * Conversation-Message streamen
   */
  streamConversationMessage(threadId: string, dto: any, messages: any[], systemPrompt?: string, context?: string): Observable<any> {
    return new Observable((subscriber) => {
      this.streamConversationLLMResponse(threadId, dto, messages, systemPrompt, context, subscriber)
        .then(() => {
          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });
    });
  }

  /**
   * LLM-Response für Chat streamen
   */
  private async streamLLMResponse(chatId: string, dto: SendMessageDto, subscriber: any): Promise<void> {
    try {
      const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);
      let fullContent = '';

      // LLM-Gateway mit Streaming aufrufen
      const response = await firstValueFrom(
        this.httpService.post(
          `${llmGatewayUrl}/v1/chat/completions`,
          {
            model: dto.model || 'gpt-4',
            provider: dto.provider || 'openai',
            messages: [
              {
                role: 'user',
                content: dto.message,
              },
            ],
            stream: true,
            temperature: dto.temperature || 0.7,
            max_tokens: dto.maxTokens || 2000,
          },
          {
            responseType: 'stream',
          },
        ),
      );

      // Stream verarbeiten
      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();

        // SSE-Format: "data: {json}\n\n"
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();

            if (data === '[DONE]') {
              // Stream beendet
              return;
            }

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content || '';

              if (content) {
                fullContent += content;
                // SSE-Event emittieren
                subscriber.next({
                  type: 'chunk',
                  content,
                  chatId,
                });
              }
            } catch (error) {
              this.logger.warn(`Failed to parse SSE data: ${error}`);
            }
          }
        }
      });

      response.data.on('end', async () => {
        // Finale Nachricht in DB speichern
        try {
          const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
          });

          if (chat) {
            await this.prisma.message.create({
              data: {
                chatId,
                role: 'assistant',
                content: fullContent,
              },
            });
          }

          subscriber.next({
            type: 'done',
            content: fullContent,
            chatId,
          });
        } catch (error: any) {
          this.logger.error(`Failed to save message: ${error.message}`);
        }

        this.logger.log(`Stream completed for chat ${chatId}`);
      });

      response.data.on('error', (error: Error) => {
        this.logger.error(`Stream error: ${error.message}`);
        subscriber.error(error);
      });
    } catch (error: any) {
      this.logger.error(`Streaming failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * LLM-Response für Conversation streamen
   */
  private async streamConversationLLMResponse(
    threadId: string,
    dto: any,
    messages: any[],
    systemPrompt?: string,
    context?: string,
    subscriber?: any,
  ): Promise<void> {
    try {
      const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);
      let fullContent = '';

      // Messages für LLM aufbauen
      const llmMessages: Array<{ role: string; content: string }> = [];

      if (systemPrompt) {
        let systemContent = systemPrompt;
        if (context) {
          systemContent += `\n\nVerwende die folgenden Informationen:\n\n${context}`;
        }
        llmMessages.push({ role: 'system', content: systemContent });
      }

      // Chat-Historie
      messages.forEach((msg) => {
        llmMessages.push({
          role: msg.role,
          content: msg.content,
        });
      });

      // Aktuelle Nachricht
      llmMessages.push({
        role: 'user',
        content: dto.message,
      });

      // LLM-Gateway mit Streaming aufrufen
      const response = await firstValueFrom(
        this.httpService.post(
          `${llmGatewayUrl}/v1/chat/completions`,
          {
            model: 'gpt-4',
            messages: llmMessages,
            stream: true,
            temperature: 0.7,
            max_tokens: 2000,
          },
          {
            responseType: 'stream',
          },
        ),
      );

      // Stream verarbeiten
      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();

            if (data === '[DONE]') {
              return;
            }

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content || '';

              if (content) {
                fullContent += content;
                if (subscriber) {
                  subscriber.next({
                    type: 'chunk',
                    content,
                    threadId,
                  });
                }
              }
            } catch (error) {
              this.logger.warn(`Failed to parse SSE data: ${error}`);
            }
          }
        }
      });

      response.data.on('end', async () => {
        // Finale Nachricht in DB speichern
        try {
          const conversation = await this.prisma.conversation.findUnique({
            where: { threadId },
          });

          if (conversation) {
            await this.prisma.conversationMessage.create({
              data: {
                conversationId: conversation.id,
                role: 'assistant',
                content: fullContent,
                citations: dto.citations || null,
              },
            });

            await this.prisma.conversation.update({
              where: { id: conversation.id },
              data: { updatedAt: new Date() },
            });
          }

          if (subscriber) {
            subscriber.next({
              type: 'done',
              content: fullContent,
              threadId,
              citations: dto.citations || [],
            });
          }
        } catch (error: any) {
          this.logger.error(`Failed to save conversation message: ${error.message}`);
        }

        this.logger.log(`Stream completed for conversation ${threadId}`);
      });

      response.data.on('error', (error: Error) => {
        this.logger.error(`Stream error: ${error.message}`);
        if (subscriber) {
          subscriber.error(error);
        }
      });
    } catch (error: any) {
      this.logger.error(`Streaming failed: ${error.message}`);
      throw error;
    }
  }
}


