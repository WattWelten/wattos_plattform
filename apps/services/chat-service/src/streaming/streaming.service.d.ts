import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { SendMessageDto } from '../chat/dto/send-message.dto';
import { PrismaService } from '@wattweiser/db';
import { ServiceDiscoveryService } from '@wattweiser/shared';
export declare class StreamingService {
    private readonly prismaService;
    private readonly configService;
    private readonly httpService;
    private readonly serviceDiscovery;
    private readonly logger;
    constructor(prismaService: PrismaService, configService: ConfigService, httpService: HttpService, serviceDiscovery: ServiceDiscoveryService);
    streamChatMessage(chatId: string, dto: SendMessageDto): Observable<any>;
    streamConversationMessage(threadId: string, dto: any, messages: any[], systemPrompt?: string, context?: string): Observable<any>;
    private streamLLMResponse;
    private streamConversationLLMResponse;
}
//# sourceMappingURL=streaming.service.d.ts.map