import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@wattweiser/db';
import { HttpService } from '@nestjs/axios';
import { SendConversationMessageDto } from './dto/send-message.dto';
import { StreamingService } from '../streaming/streaming.service';
import { ServiceDiscoveryService } from '@wattweiser/shared';
export declare class ConversationsService {
    private readonly prismaService;
    private readonly configService;
    private readonly httpService;
    private readonly streamingService;
    private readonly serviceDiscovery;
    private readonly logger;
    constructor(prismaService: PrismaService, configService: ConfigService, httpService: HttpService, streamingService: StreamingService, serviceDiscovery: ServiceDiscoveryService);
    createConversation(role: string): Promise<{
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
    private getRagContextWithConfig;
    private buildMessages;
}
//# sourceMappingURL=conversations.service.d.ts.map