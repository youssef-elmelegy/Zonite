import { GameStatus } from '../enums/game-status.enum.js';
import { GameMode } from '../enums/game-mode.enum.js';
import type { Block } from './block.type.js';
import type { Player } from './player.type.js';

export interface GameState {
  roomId: string;
  roomCode: string;
  /** Square board edge length (N×N). */
  size: number;
  status: GameStatus;
  gameMode: GameMode;
  /** 2D array indexed as grid[y][x]. */
  grid: Block[][];
  /** Keyed by player id. */
  players: Record<string, Player>;
  remainingSeconds: number;
  /** ISO-8601 timestamp, null until status === PLAYING. */
  startedAt: string | null;
}
