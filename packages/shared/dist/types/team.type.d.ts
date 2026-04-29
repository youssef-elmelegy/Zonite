import { TeamColor } from '../enums/team-color.enum.js';
export interface Team {
    /** RED or BLUE. NONE is a sentinel, never a real team. */
    color: TeamColor;
    score: number;
    playerIds: string[];
}
//# sourceMappingURL=team.type.d.ts.map