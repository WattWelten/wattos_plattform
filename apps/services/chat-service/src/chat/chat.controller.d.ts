import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { StreamingService } from '../streaming/streaming.service';
import { Observable } from 'rxjs';
export declare class ChatController {
    private readonly chatService;
    private readonly streamingService;
    constructor(chatService: ChatService, streamingService: StreamingService);
    createChat(dto: CreateChatDto): Promise<any>;
    getChat(chatId: string): Promise<any>;
    listChats(userId: string, tenantId: string, limit?: number, offset?: number): Promise<any>;
    sendMessage(chatId: string, dto: SendMessageDto): Promise<import("./interfaces/chat.interface").ChatResponse>;
    streamMessage(chatId: string, dto: SendMessageDto): Observable<any>;
}
//# sourceMappingURL=chat.controller.d.ts.map