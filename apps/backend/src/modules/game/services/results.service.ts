import { Injectable } from '@nestjs/common';
import { GameMode, TeamColor } from '@zonite/shared';
import type { PlayerOutcome, Results, PlayerResult, TeamResult } from '@zonite/shared';
import type { InternalGameState } from '../types/internal-game-state.type';

@Injectable()
export class ResultsService {
  calculate(state: InternalGameState): Results {
    const players = Object.values(state.players);

    let teamRankings: TeamResult[] | null = null;
    let isDraw = false;

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
    } else {
      // SOLO: draw when 2+ players tie at the top score.
      const topScore = players.reduce((m, p) => Math.max(m, p.score), 0);
      const topCount = players.filter((p) => p.score === topScore).length;
      isDraw = topCount > 1 && topScore > 0;
    }

    // Compute outcome per player.
    const winningTeam =
      state.gameMode === GameMode.TEAM && !isDraw && teamRankings
        ? teamRankings[0]?.teamColor
        : null;
    const soloTopScore =
      state.gameMode === GameMode.SOLO ? players.reduce((m, p) => Math.max(m, p.score), 0) : 0;

    const playerRankings: PlayerResult[] = players
      .map((p) => {
        let outcome: PlayerOutcome;
        if (state.gameMode === GameMode.TEAM) {
          if (isDraw) outcome = 'DRAW';
          else outcome = p.teamColor === winningTeam ? 'WIN' : 'LOSS';
        } else {
          // SOLO
          if (p.score === soloTopScore && soloTopScore > 0) {
            outcome = isDraw ? 'DRAW' : 'WIN';
          } else {
            outcome = 'LOSS';
          }
        }
        return {
          playerId: p.id,
          fullName: p.fullName,
          teamColor: p.teamColor,
          color: p.color,
          score: p.score,
          rank: 0,
          outcome,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));

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
