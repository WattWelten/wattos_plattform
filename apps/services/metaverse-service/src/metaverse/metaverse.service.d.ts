export declare class MetaverseService {
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
//# sourceMappingURL=metaverse.service.d.ts.map