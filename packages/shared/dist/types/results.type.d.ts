import { GameMode } from '../enums/game-mode.enum.js';
import { TeamColor } from '../enums/team-color.enum.js';
import type { Block } from './block.type.js';
export type PlayerOutcome = 'WIN' | 'LOSS' | 'DRAW';
export interface PlayerResult {
    playerId: string;
    fullName: string;
    teamColor: TeamColor;
    /** Hex color (solo mode). Empty string in team mode. */
    color: string;
    score: number;
    rank: number;
    /** Per-player outcome — drives stats updates and history rows. */
    outcome: PlayerOutcome;
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
    /** True when the top scorers tie (TEAM: both teams equal; SOLO: 2+ players tied at the top). */
    isDraw?: boolean;
}
//# sourceMappingURL=results.type.d.ts.map