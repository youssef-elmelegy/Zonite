import { GameMode } from '../enums/game-mode.enum';
import { GameStatus } from '../enums/game-status.enum';
import type { LobbyPlayer } from './lobby-player.type';

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
