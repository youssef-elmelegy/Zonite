import { TeamColor } from '../enums/team-color.enum.js';
export interface LobbyPlayer {
    id: string;
    fullName: string;
    teamColor: TeamColor;
    /** Hex color (solo mode). Empty string in team mode. */
    color: string;
    isReady: boolean;
    isHost: boolean;
}
//# sourceMappingURL=lobby-player.type.d.ts.map