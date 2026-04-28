import { Injectable } from '@nestjs/common';
import { GameMode, TeamColor } from '@zonite/shared';
import type { Results, PlayerResult, TeamResult } from '@zonite/shared';
import type { InternalGameState } from '../types/internal-game-state.type';

@Injectable()
export class ResultsService {
  calculate(state: InternalGameState): Results {
    const players = Object.values(state.players);

    const playerRankings: PlayerResult[] = players
      .map((p) => ({
        playerId: p.id,
        fullName: p.fullName,
        teamColor: p.teamColor,
        color: p.color,
        score: p.score,
        rank: 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));

    let teamRankings: TeamResult[] | null = null;
    let isDraw: boolean | undefined;

    if (state.gameMode === GameMode.TEAM) {
      const teamScores: Record<string, number> = {
        [TeamColor.RED]: 0,
        [TeamColor.BLUE]: 0,
      };

      for (const p of players) {
        if (p.teamColor === TeamColor.RED || p.teamColor === TeamColor.BLUE) {
          teamScores[p.teamColor] += p.score;
        }
      }

      const ranked = ([TeamColor.RED, TeamColor.BLUE] as const)
        .map((tc) => ({ teamColor: tc, score: teamScores[tc] ?? 0 }))
        .sort((a, b) => b.score - a.score);

      if (ranked[0]?.score === ranked[1]?.score) {
        isDraw = true;
        teamRankings = ranked.map((t) => ({ ...t, rank: 1 }));
      } else {
        teamRankings = ranked.map((t, i) => ({ ...t, rank: i + 1 }));
      }
    }

    return {
      roomId: state.roomId,
      gameMode: state.gameMode,
      size: state.size,
      grid: state.grid,
      playerRankings,
      teamRankings,
      isDraw,
    };
  }
}
