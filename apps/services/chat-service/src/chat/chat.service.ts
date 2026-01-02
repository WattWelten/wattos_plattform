import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@wattweiser/db';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ChatRequest, ChatResponse, ChatMessage } from './interfaces/chat.interface';
import { StreamingService } from '../streaming/streaming.service';

/**
 * Chat Service
 * Orchestriert Chat-Konversationen mit Multi-LLM-Support und RAG
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly streamingService: StreamingService,
  ) {}

  /**
   * Chat-Nachricht senden
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Chat aus DB laden oder erstellen
      let chat = await this.prismaService.client.chat.findUnique({
        where: { id: request.chatId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!chat) {
        throw new NotFoundException(`Chat ${request.chatId} not found`);
      }

      // User-Nachricht speichern
      const userMessage = await this.prismaService.client.message.create({
        data: {
          chatId: request.chatId,
          role: 'user',
          content: request.message,
          metadata: request.metadata || {},
        },
      });

      // RAG-Context abrufen (falls aktiviert)
      let context = '';
      let citations: any[] = [];

      if (request.knowledgeSpaceId) {
        const ragContext = await this.getRagContext(request.message, request.knowledgeSpaceId);
        context = ragContext.context;
        citations = ragContext.citations;
      }

      // LLM-Aufruf vorbereiten
      const messages = this.buildMessages(chat.messages, request.message, context);
      const llmRequest = {
        model: request.model || 'gpt-4',
        provider: request.provider || 'openai',
        messages,
        stream: request.stream || false,
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || 2000,
      };

      // LLM-Gateway aufrufen
      const llmGatewayUrl = this.configService.get('llmGateway.url');
      const response = await firstValueFrom(
        this.httpService.post(`${llmGatewayUrl}/v1/chat/completions`, llmRequest),
      );

      const assistantContent = response.data.choices[0]?.message?.content || '';

      // Assistant-Nachricht speichern
      const assistantMessage = await this.prismaService.client.message.create({
        data: {
          chatId: request.chatId,
          role: 'assistant',
          content: assistantContent,
          citations: citations as any,
          metadata: {
            model: llmRequest.model,
            provider: llmRequest.provider,
            usage: response.data.usage,
          },
        },
      });

      // Chat aktualisieren
      await this.prismaService.client.chat.update({
        where: { id: request.chatId },
        data: { updatedAt: new Date() },
      });

      return {
        messageId: assistantMessage.id,
        content: assistantContent,
        citations,
        metadata: {
          model: llmRequest.model,
          provider: llmRequest.provider,
          usage: response.data.usage,
        },
      };
    } catch (error: any) {
      this.logger.error(`Chat message failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * RAG-Context abrufen
   */
  private async getRagContext(query: string, knowledgeSpaceId: string): Promise<{ context: string; citations: any[] }> {
    try {
      const ragServiceUrl = this.configService.get('ragService.url');

      // Search durchführen
      const searchResponse = await firstValueFrom(
        this.httpService.post(`${ragServiceUrl}/search`, {
          knowledgeSpaceId,
          query,
          topK: 5,
        }),
      );

      const searchResults = searchResponse.data.results || [];

      // Context bauen
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
    context?: string,
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // System-Prompt mit Context (falls vorhanden)
    if (context) {
      messages.push({
        role: 'system',
        content: `Du bist ein hilfreicher Assistent. Verwende die folgenden Informationen, um die Frage des Benutzers zu beantworten:\n\n${context}`,
      });
    } else {
      messages.push({
        role: 'system',
        content: 'Du bist ein hilfreicher Assistent.',
      });
    }

    // Chat-Historie hinzufügen
    history.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Aktuelle Nachricht hinzufügen
    messages.push({
      role: 'user',
      content: currentMessage,
    });

    return messages;
  }

  /**
   * Chat erstellen
   */
  async createChat(userId: string, tenantId: string, title?: string) {
    const chat = await this.prismaService.client.chat.create({
      data: {
        userId,
        tenantId,
        title: title || 'New Chat',
        metadata: {},
      },
    });

    return chat;
  }

  /**
   * Chat abrufen
   */
  async getChat(chatId: string) {
    const chat = await this.prismaService.client.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException(`Chat ${chatId} not found`);
    }

    return chat;
  }

  /**
   * Chats auflisten
   */
  async listChats(userId: string, tenantId: string, limit = 20, offset = 0) {
    const chats = await this.prismaService.client.chat.findMany({
      where: {
        userId,
        tenantId,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return chats;
  }
}


