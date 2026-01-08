import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { ChatService } from '../chat/chat.service';
export declare class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly configService;
    private readonly chatService;
    server: Server;
    private readonly logger;
    private connectedClients;
    constructor(configService: ConfigService, chatService: ChatService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleMessage(client: Socket, data: any): Promise<void>;
    handleStreamMessage(client: Socket, data: any): Promise<void>;
    handleJoinChat(client: Socket, data: {
        chatId: string;
    }): void;
    handleLeaveChat(client: Socket, data: {
        chatId: string;
    }): void;
    broadcastToChat(chatId: string, event: string, data: any): void;
}
//# sourceMappingURL=websocket.gateway.d.ts.map