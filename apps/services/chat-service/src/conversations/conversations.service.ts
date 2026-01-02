import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@wattweiser/db';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SendConversationMessageDto } from './dto/send-message.dto';
import { StreamingService } from '../streaming/streaming.service';
import { ServiceDiscoveryService } from '@wattweiser/shared';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly streamingService: StreamingService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  /**
   * Conversation erstellen
   */
  async createConversation(role: string) {
    try {
      // Character nach role finden
      const character = await this.prismaService.client.character.findFirst({
        where: { role },
      });

      if (!character) {
        throw new NotFoundException(`Character mit role "${role}" nicht gefunden`);
      }

      // Conversation erstellen
      const conversation = await this.prismaService.client.conversation.create({
        data: {
          characterId: character.id,
        },
      });

      return {
        thread_id: conversation.threadId,
        role: character.role,
      };
    } catch (error: any) {
      this.logger.error(`Conversation creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Conversation abrufen
   */
  async getConversation(threadId: string) {
    const conversation = await this.prismaService.client.conversation.findUnique({
      where: { threadId },
      include: {
        character: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation mit threadId "${threadId}" nicht gefunden`);
    }

    return {
      thread_id: conversation.threadId,
      role: conversation.character?.role,
      messages: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        citations: m.citations,
        created_at: m.createdAt,
      })),
    };
  }

  /**
   * Nachricht senden
   */
  async sendMessage(dto: SendConversationMessageDto) {
    try {
      // Conversation laden
      const conversation = await this.prismaService.client.conversation.findUnique({
        where: { threadId: dto.thread_id },
        include: {
          character: true,
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation || !conversation.character) {
        throw new NotFoundException(`Conversation nicht gefunden`);
      }

      // User-Nachricht speichern
      await this.prismaService.client.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: dto.message,
        },
      });

      // RAG-Context abrufen (mit search_tool_config falls vorhanden)
      let context = '';
      let citations: any[] = [];

      if (dto.search_tool_config) {
        const ragContext = await this.getRagContextWithConfig(
          dto.message,
          conversation.character.knowledgeBase as any,
          dto.search_tool_config,
        );
        context = ragContext.context;
        citations = ragContext.citations;
      }

      // Messages für LLM aufbauen
      const messages = this.buildMessages(
        conversation.messages,
        dto.message,
        conversation.character.systemPrompt || undefined,
        context,
      );

      // LLM-Aufruf
      const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);
      const response = await firstValueFrom(
        this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, {
          model: 'gpt-4',
          messages,
          stream: false,
        }),
      );

      const assistantContent = response.data.choices[0]?.message?.content || '';

      // Assistant-Nachricht speichern
      await this.prismaService.client.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: assistantContent,
          citations: citations as any,
        },
      });

      // Conversation aktualisieren
      await this.prismaService.client.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return {
        thread_id: conversation.threadId,
        role: conversation.character.role,
        message: assistantContent,
        citations,
      };
    } catch (error: any) {
      this.logger.error(`Send message failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Streaming-Nachricht
   */
  streamMessage(dto: SendConversationMessageDto): Observable<any> {
    return new Observable(async (subscriber) => {
      try {
        // Conversation laden
        const conversation = await this.prismaService.client.conversation.findUnique({
          where: { threadId: dto.thread_id },
          include: {
            character: true,
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        if (!conversation || !conversation.character) {
          subscriber.error(new Error('Conversation nicht gefunden'));
          return;
        }

        // User-Nachricht speichern
        await this.prismaService.client.conversationMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'user',
            content: dto.message,
          },
        });

        // RAG-Context abrufen
        let context = '';
        let citations: any[] = [];

        if (dto.search_tool_config) {
          const ragContext = await this.getRagContextWithConfig(
            dto.message,
            conversation.character.knowledgeBase as any,
            dto.search_tool_config,
          );
          context = ragContext.context;
          citations = ragContext.citations;
        }

        // Streaming starten
        const stream = this.streamingService.streamConversationMessage(
          dto.thread_id,
          { ...dto, citations },
          conversation.messages,
          conversation.character.systemPrompt || undefined,
          context,
        );

        stream.subscribe({
          next: (data) => subscriber.next(data),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });
      } catch (error: any) {
        subscriber.error(error);
      }
    });
  }

  /**
   * Audio-Streaming-Nachricht
   */
  streamAudioMessage(dto: SendConversationMessageDto): Observable<any> {
    // Audio-Streaming: Text-Stream → TTS → Audio-Chunks
    return new Observable((subscriber) => {
      const textStream = this.streamingService.streamChatMessage(dto.thread_id, {
        message: dto.message,
        model: dto.model,
        provider: dto.provider,
        temperature: dto.temperature,
        maxTokens: dto.max_tokens,
        search_tool_config: dto.search_tool_config,
      } as any);

      let fullTextContent = '';

      textStream.subscribe({
        next: async (data) => {
          if (data.type === 'chunk') {
            fullTextContent += data.content;
            // Text-Chunks für sofortige Anzeige senden
            subscriber.next({ type: 'text_chunk', content: data.content });
          } else if (data.type === 'done') {
            // TTS für vollständigen Text aufrufen
            try {
              const voiceServiceUrl = this.configService.get<string>('voiceService.url', 'http://localhost:3016');
              const ttsResponse = await firstValueFrom(
                this.httpService.post(
                  `${voiceServiceUrl}/api/v1/voice/tts`,
                  {
                    text: fullTextContent,
                    language: dto.language || 'de',
                    streaming: false,
                  },
                  {
                    responseType: 'arraybuffer',
                  },
                ),
              );

              const audioBuffer = Buffer.from(ttsResponse.data);
              subscriber.next({
                type: 'audio_chunk',
                audio: audioBuffer.toString('base64'),
                is_final: true,
              });
              subscriber.complete();
            } catch (error: any) {
              this.logger.error(`TTS failed: ${error.message}`);
              subscriber.error(error);
            }
          } else {
            subscriber.next(data);
          }
        },
        error: (error) => subscriber.error(error),
        complete: () => {
          if (!fullTextContent) {
            subscriber.complete();
          }
        },
      });
    });
  }

  /**
   * RAG-Context mit search_tool_config abrufen
   */
  private async getRagContextWithConfig(
    query: string,
    knowledgeBase: any,
    config: { strategy?: string; top_k?: number },
  ): Promise<{ context: string; citations: any[] }> {
    try {
      const ragServiceUrl = this.serviceDiscovery.getServiceUrl('rag-service', 3007);
      const topK = config.top_k || 4;

      // Knowledge Space ID aus Character's Knowledge Base extrahieren
      const knowledgeSpaceId = knowledgeBase?.knowledgeSpaceId || knowledgeBase?.knowledge_space_id;
      
      if (!knowledgeSpaceId) {
        this.logger.warn('No knowledge space configured for character');
        return { context: '', citations: [] };
      }

      // Two-stage Retrieval wenn aktiviert
      if (config.strategy === 'two_stage') {
        // Erste Stufe: Grobe Suche
        const coarseSearch = await firstValueFrom(
          this.httpService.post(`${ragServiceUrl}/search`, {
            knowledgeSpaceId,
            query,
            topK: topK * 2, // Mehr Ergebnisse für zweite Stufe
          }),
        );

        // Zweite Stufe: Feine Suche auf Top-Ergebnisse
        const chunkIds = coarseSearch.data.results?.slice(0, topK * 2).map((r: any) => r.chunkId) || [];
        const fineSearch = await firstValueFrom(
          this.httpService.post(`${ragServiceUrl}/search`, {
            knowledgeSpaceId,
            query,
            topK,
            filters: {
              chunkIds, // Filter auf bereits gefundene Chunks
            },
          }),
        );

        const searchResults = fineSearch.data.results || [];
        const contextResponse = await firstValueFrom(
          this.httpService.post(`${ragServiceUrl}/context/build`, {
            searchResults,
            maxTokens: 2000,
            includeMetadata: true,
          }),
        );

        return {
          context: contextResponse.data.context || '',
          citations: contextResponse.data.citations || [],
        };
      } else {
        // Single-stage Retrieval
        const searchResponse = await firstValueFrom(
          this.httpService.post(`${ragServiceUrl}/search`, {
            knowledgeSpaceId,
            query,
            topK,
          }),
        );

        const searchResults = searchResponse.data.results || [];
        const contextResponse = await firstValueFrom(
          this.httpService.post(`${ragServiceUrl}/context/build`, {
            searchResults,
            maxTokens: 2000,
            includeMetadata: true,
          }),
        );

        return {
          context: contextResponse.data.context || '',
          citations: contextResponse.data.citations || [],
        };
      }
    } catch (error: any) {
      this.logger.warn(`RAG context retrieval failed: ${error.message}`);
      return { context: '', citations: [] };
    }
  }

  /**
   * Messages für LLM aufbauen
   */
  private buildMessages(
    history: any[],
    currentMessage: string,
    systemPrompt?: string,
    context?: string,
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // System-Prompt mit Context
    let systemContent = systemPrompt || 'Du bist ein hilfreicher Assistent.';
    if (context) {
      systemContent += `\n\nVerwende die folgenden Informationen, um die Frage des Benutzers zu beantworten:\n\n${context}`;
    }
    messages.push({
      role: 'system',
      content: systemContent,
    });

    // Chat-Historie
    history.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Aktuelle Nachricht
    messages.push({
      role: 'user',
      content: currentMessage,
    });

    return messages;
  }
}

