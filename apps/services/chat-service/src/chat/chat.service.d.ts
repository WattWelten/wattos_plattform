import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@wattweiser/db';
import { HttpService } from '@nestjs/axios';
import { ChatRequest, ChatResponse } from './interfaces/chat.interface';
import { StreamingService } from '../streaming/streaming.service';
export declare class ChatService {
    private readonly prismaService;
    private readonly configService;
    private readonly httpService;
    private readonly streamingService;
    private readonly logger;
    constructor(prismaService: PrismaService, configService: ConfigService, httpService: HttpService, streamingService: StreamingService);
    sendMessage(request: ChatRequest): Promise<ChatResponse>;
    private getRagContext;
    private buildMessages;
    createChat(userId: string, tenantId: string, title?: string): Promise<any>;
    getChat(chatId: string): Promise<any>;
    listChats(userId: string, tenantId: string, limit?: number, offset?: number): Promise<any>;
}
//# sourceMappingURL=chat.service.d.ts.map