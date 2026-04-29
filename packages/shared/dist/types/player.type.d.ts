import { TeamColor } from '../enums/team-color.enum.js';
export interface Player {
    /** Stable user id (UUID). */
    id: string;
    fullName: string;
    /** NONE in solo mode. */
    teamColor: TeamColor;
    score: number;
    /** Hex color for solo-mode display. Empty string in team mode (team color is used instead). */
    color: string;
}
//# sourceMappingURL=player.type.d.ts.map