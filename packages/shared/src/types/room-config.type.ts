import { GameMode } from '../enums/game-mode.enum';

export interface RoomConfig {
  /** SOLO or TEAM. Locked at room creation. */
  gameMode: GameMode;
  /** Grid width in blocks. min 5, max 50, default 20. */
  gridWidth: number;
  /** Grid height in blocks. min 5, max 50, default 20. */
  gridHeight: number;
  /** Round length in seconds. min 30, max 300, default 60. */
  durationSeconds: number;
  /** Maximum concurrent players. default 10. */
  maxPlayers: number;
}
