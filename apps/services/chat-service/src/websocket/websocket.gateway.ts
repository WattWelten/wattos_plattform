import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatService } from '../chat/chat.service';
import { SendMessageDto } from '../chat/dto/send-message.dto';

/**
 * WebSocket Gateway
 * Handles WebSocket-Verbindungen für Echtzeit-Chat
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private connectedClients: Map<string, Socket> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
  ) {}

  handleConnection(client: Socket) {
    const clientId = client.id;
    this.connectedClients.set(clientId, client);
    this.logger.log(`Client connected: ${clientId}`);

    // Client über Verbindung informieren
    client.emit('connected', { clientId, timestamp: new Date().toISOString() });
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.connectedClients.delete(clientId);
    this.logger.log(`Client disconnected: ${clientId}`);
  }

  @SubscribeMessage('message')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    try {
      const { chatId, message, model, provider, knowledgeSpaceId } = data;

      if (!chatId || !message) {
        client.emit('error', { message: 'chatId and message are required' });
        return;
      }

      // Chat-Service aufrufen
      const response = await this.chatService.sendMessage({
        chatId,
        message,
        model,
        provider,
        knowledgeSpaceId,
        stream: false,
      });

      // Response an Client senden
      client.emit('message_response', {
        messageId: response.messageId,
        content: response.content,
        citations: response.citations,
        metadata: response.metadata,
      });
    } catch (error: any) {
      this.logger.error(`WebSocket message handling failed: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('stream_message')
  async handleStreamMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    try {
      const { chatId, message, model, provider, knowledgeSpaceId } = data;

      if (!chatId || !message) {
        client.emit('error', { message: 'chatId and message are required' });
        return;
      }

      // Streaming starten (TODO: Implementierung)
      client.emit('stream_start', { chatId });

      // Chat-Service mit Streaming aufrufen
      const response = await this.chatService.sendMessage({
        chatId,
        message,
        model,
        provider,
        knowledgeSpaceId,
        stream: true,
      });

      // Streamed Response an Client senden
      // TODO: Chunked Streaming implementieren
      client.emit('stream_chunk', {
        content: response.content,
        done: true,
      });
    } catch (error: any) {
      this.logger.error(`WebSocket stream handling failed: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('join_chat')
  handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string }) {
    const { chatId } = data;
    client.join(`chat:${chatId}`);
    this.logger.log(`Client ${client.id} joined chat ${chatId}`);
    client.emit('joined_chat', { chatId });
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string }) {
    const { chatId } = data;
    client.leave(`chat:${chatId}`);
    this.logger.log(`Client ${client.id} left chat ${chatId}`);
    client.emit('left_chat', { chatId });
  }

  /**
   * Nachricht an alle Clients in einem Chat senden
   */
  broadcastToChat(chatId: string, event: string, data: any) {
    this.server.to(`chat:${chatId}`).emit(event, data);
  }
}


