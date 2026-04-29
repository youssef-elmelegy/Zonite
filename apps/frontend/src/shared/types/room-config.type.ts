import { GameMode } from '../enums/game-mode.enum';

export interface RoomConfig {
  gameMode: GameMode;
  /** Square board edge length. min 5, max 50, default 12. Board is always N×N. */
  gridSize: number;
  /** Round length in seconds. Presets: 30 / 60 / 90 / 120. min 30, max 300, default 60. */
  durationSeconds: number;
  /** Maximum concurrent players. min 2, max 10, default 6. */
  maxPlayers: number;
}

export interface UpdateRoomPayload {
  roomCode: string;
  gridSize?: number;
  durationSeconds?: number;
  maxPlayers?: number;
  gameMode?: GameMode;
}
