import { GameMode } from '@zonite/shared';
import type { GameState, Player } from '@zonite/shared';

export interface InternalPlayer extends Player {
  /** Socket.io socket id, null if player is disconnected. */
  socketId: string | null;
}

export interface InternalGameState extends Omit<GameState, 'players'> {
  /** 6-char room code — used as the socket.io room key. */
  roomCode: string;
  gameMode: GameMode;
  players: Record<string, InternalPlayer>;
  /** Active setInterval handle; null after game ends. */
  intervalHandle: ReturnType<typeof setInterval> | null;
}
