import { GameMode } from '../enums/game-mode.enum';
import { GameStatus } from '../enums/game-status.enum';
export interface Room {
    id: string;
    code: string;
    status: GameStatus;
    hostUserId: string;
    gameMode: GameMode;
    gridSize: number;
    durationSeconds: number;
    maxPlayers: number;
    createdAt: string;
    startedAt: string | null;
    endedAt: string | null;
}
//# sourceMappingURL=room.type.d.ts.map