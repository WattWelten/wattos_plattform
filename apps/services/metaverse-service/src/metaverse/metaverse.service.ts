import { Injectable } from '@nestjs/common';

@Injectable()
export class MetaverseService {
  async createRoom(name: string) {
    return { roomId: `room_${Date.now()}`, name, url: `https://metaverse.example.com/room/${Date.now()}` };
  }

  async getRoom(roomId: string) {
    return { roomId, name: 'Example Room', participants: [] };
  }
}


