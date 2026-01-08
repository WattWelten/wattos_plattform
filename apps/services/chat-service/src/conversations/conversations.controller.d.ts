import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendConversationMessageDto } from './dto/send-message.dto';
import { Observable } from 'rxjs';
export declare class ConversationsController {
    private readonly conversationsService;
    constructor(conversationsService: ConversationsService);
    createConversation(dto: CreateConversationDto): Promise<{
        thread_id: any;
        role: any;
    }>;
    getConversation(threadId: string): Promise<{
        thread_id: any;
        role: any;
        messages: any;
    }>;
    sendMessage(dto: SendConversationMessageDto): Promise<{
        thread_id: any;
        role: any;
        message: any;
        citations: any[];
    }>;
    streamMessage(dto: SendConversationMessageDto): Observable<any>;
    streamAudioMessage(dto: SendConversationMessageDto): Observable<any>;
}
//# sourceMappingURL=conversations.controller.d.ts.map