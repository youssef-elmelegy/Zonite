import { GameMode } from '../enums/game-mode.enum.js';
import { GameStatus } from '../enums/game-status.enum.js';
import type { LobbyPlayer } from './lobby-player.type.js';

/** Full lobby snapshot — payload for the `room_state` socket event. */
export interface RoomState {
  roomCode: string;
  status: GameStatus;
  gameMode: GameMode;
  gridSize: number;
  durationSeconds: number;
  maxPlayers: number;
  /** True for rooms created by the YalGamers tournament integration. */
  isTournament: boolean;
  players: LobbyPlayer[];
}
