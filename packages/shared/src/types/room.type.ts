import { GameMode } from '../enums/game-mode.enum.js';
import { GameStatus } from '../enums/game-status.enum.js';

export interface Room {
  id: string;
  code: string;
  status: GameStatus;
  hostUserId: string;
  gameMode: GameMode;
  gridSize: number;
  durationSeconds: number;
  maxPlayers: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}
