import { GameMode } from '../enums/game-mode.enum';
import { TeamColor } from '../enums/team-color.enum';
import type { Block } from './block.type';

export interface PlayerResult {
  playerId: string;
  fullName: string;
  teamColor: TeamColor;
  /** Hex color (solo mode). Empty string in team mode. */
  color: string;
  score: number;
  rank: number;
}

export interface TeamResult {
  teamColor: TeamColor.RED | TeamColor.BLUE;
  score: number;
  rank: number;
}

export interface Results {
  roomId: string;
  gameMode: GameMode;
  /** Square board edge length. */
  size: number;
  grid: Block[][];
  playerRankings: PlayerResult[];
  /** null in SOLO mode. */
  teamRankings: TeamResult[] | null;
  /** true only in TEAM mode when both teams have equal scores. */
  isDraw?: boolean;
}
