import { MetaverseService } from './metaverse.service';
export declare class MetaverseController {
    private readonly service;
    constructor(service: MetaverseService);
    createRoom(name: string): Promise<{
        roomId: string;
        name: string;
        url: string;
    }>;
    getRoom(roomId: string): Promise<{
        roomId: string;
        name: string;
        participants: any[];
    }>;
}
//# sourceMappingURL=metaverse.controller.d.ts.map