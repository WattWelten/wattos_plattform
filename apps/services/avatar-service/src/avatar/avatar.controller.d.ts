import { AvatarService } from './avatar.service';
export declare class AvatarController {
    private readonly avatarService;
    constructor(avatarService: AvatarService);
    generateAvatar(agentId: string, body: {
        text: string;
        voiceId?: string;
    }): Promise<{
        avatarUrl: string;
        audioUrl: string;
        videoUrl?: string;
    }>;
    streamAvatar(agentId: string): Promise<{
        streamUrl: string;
        websocketUrl: string;
        sceneConfig: any;
    }>;
    getAvatarScene(agentId: string): Promise<any>;
    getAvatarVideo(agentId: string): Promise<{
        videoUrl: string;
    }>;
}
//# sourceMappingURL=avatar.controller.d.ts.map