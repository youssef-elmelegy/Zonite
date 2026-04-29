import { api } from './api';
import { GameMode } from '../shared';

export interface CreateRoomDto {
  gameMode: GameMode;
  gridSize: number;
  durationSeconds: number;
  maxPlayers: number;
}

export interface RoomRow {
  id: string;
  code: string;
  status: 'LOBBY' | 'PLAYING' | 'FINISHED';
  hostUserId: string;
  gameMode: GameMode;
  gridSize: number;
  durationSeconds: number;
  maxPlayers: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export const roomService = {
  async createRoom(dto: CreateRoomDto): Promise<RoomRow> {
    const { data } = await api.post<RoomRow>('/rooms', dto);
    return data;
  },

  async getRoom(code: string): Promise<RoomRow> {
    const { data } = await api.get<RoomRow>(`/rooms/${code}`);
    return data;
  },
};
