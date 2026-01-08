import { Observable } from 'rxjs';
import { ChatService } from '../chat/chat.service';
import { StreamingService } from '../streaming/streaming.service';
import { SendMessageDto } from '../chat/dto/send-message.dto';
export declare class SseController {
    private readonly chatService;
    private readonly streamingService;
    constructor(chatService: ChatService, streamingService: StreamingService);
    stream(chatId: string, dto: SendMessageDto): Observable<any>;
    sendMessage(chatId: string, dto: SendMessageDto): Promise<import("../chat/interfaces/chat.interface").ChatResponse>;
}
//# sourceMappingURL=sse.controller.d.ts.map