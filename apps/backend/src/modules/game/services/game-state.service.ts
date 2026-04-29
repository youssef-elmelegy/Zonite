import { Injectable, Logger } from '@nestjs/common';
import { GameStatus, GameMode, TeamColor, BLOCK_CLAIM_COOLDOWN_MS } from '@zonite/shared';
import type { GameState, Block, Results } from '@zonite/shared';
import type { DbRoom } from '@/db/schema/rooms';
import type { InternalGameState, InternalPlayer } from '../types/internal-game-state.type';
import { ResultsService } from './results.service';

export interface GameCallbacks {
  onTick: (state: GameState) => void;
  onGameOver: (results: Results) => void;
}

@Injectable()
export class GameStateService {
  private readonly logger = new Logger(GameStateService.name);
  private readonly games = new Map<string, InternalGameState>();

  static readonly SOLO_COLORS = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
  ];

  static soloColorAt(index: number): string {
    return GameStateService.SOLO_COLORS[index % GameStateService.SOLO_COLORS.length] ?? '';
  }

  constructor(private readonly resultsService: ResultsService) {}

  startGame(
    room: DbRoom,
    playerMap: Record<string, InternalPlayer>,
    callbacks: GameCallbacks,
  ): GameState {
    if (this.games.has(room.id)) {
      this.destroyGame(room.id);
    }

    const size = room.gridSize;
    const grid: Block[][] = Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => ({
        x,
        y,
        claimedBy: null,
        teamColor: null,
        cooldownUntil: 0,
      })),
    );

    const state: InternalGameState = {
      roomId: room.id,
      roomCode: room.code,
      gameMode: room.gameMode as GameMode,
      size,
      status: GameStatus.PLAYING,
      grid,
      players: { ...playerMap },
      remainingSeconds: room.durationSeconds,
      startedAt: new Date().toISOString(),
      intervalHandle: null,
    };

    state.intervalHandle = setInterval(() => {
      state.remainingSeconds -= 1;
      callbacks.onTick(this.toWireState(state));

      if (state.remainingSeconds <= 0) {
        this.endGame(room.id, callbacks);
      }
    }, 1000);

    this.games.set(room.id, state);
    this.logger.log(
      `Game started for room ${room.code} (${size}×${size}, ${room.durationSeconds}s)`,
    );
    return this.toWireState(state);
  }

  claimBlock(roomId: string, userId: string, x: number, y: number): Block {
    const state = this.requireGame(roomId);

    if (state.status !== GameStatus.PLAYING) {
      throw new Error('Game is not in PLAYING status');
    }

    const row = state.grid[y];
    if (!row) throw new Error(`Row y=${y} is out of bounds`);
    const block = row[x];
    if (!block) throw new Error(`Block (${x}, ${y}) is out of bounds`);

    const player = state.players[userId];
    if (!player) throw new Error('Player is not in this game');

    // Global per-cell cooldown — applies to everyone, including the previous owner.
    const now = Date.now();
    if (block.cooldownUntil > now) {
      throw new Error('Block is on cooldown');
    }

    if (block.claimedBy !== null) {
      // Same player can't reclaim their own block (it would be a no-op + grief).
      if (block.claimedBy === userId) {
        throw new Error('Block is already yours');
      }
      const previousOwner = state.players[block.claimedBy];
      // Same-team overwrites are blocked in TEAM mode.
      if (
        state.gameMode === GameMode.TEAM &&
        previousOwner &&
        previousOwner.teamColor === player.teamColor &&
        player.teamColor !== TeamColor.NONE
      ) {
        throw new Error('Cannot overwrite a teammate block');
      }
      // Decrement the previous owner so total score == claimed cells.
      if (previousOwner && previousOwner.score > 0) {
        previousOwner.score -= 1;
      }
    }

    block.claimedBy = userId;
    block.teamColor = player.teamColor !== TeamColor.NONE ? player.teamColor : null;
    block.cooldownUntil = now + BLOCK_CLAIM_COOLDOWN_MS;
    player.score += 1;

    return { ...block };
  }

  addPlayer(roomId: string, player: InternalPlayer): void {
    this.requireGame(roomId).players[player.id] = player;
  }

  removePlayer(roomId: string, playerId: string): void {
    const state = this.games.get(roomId);
    if (state) delete state.players[playerId];
  }

  updateSocketId(roomId: string, playerId: string, socketId: string | null): void {
    const state = this.games.get(roomId);
    const player = state?.players[playerId];
    if (player) player.socketId = socketId;
  }

  getState(roomId: string): GameState | null {
    const state = this.games.get(roomId);
    return state ? this.toWireState(state) : null;
  }

  getRoomCode(roomId: string): string | null {
    return this.games.get(roomId)?.roomCode ?? null;
  }

  hasGame(roomId: string): boolean {
    return this.games.has(roomId);
  }

  destroyGame(roomId: string): void {
    const state = this.games.get(roomId);
    if (state?.intervalHandle) clearInterval(state.intervalHandle);
    this.games.delete(roomId);
    this.logger.log(`Game state destroyed for room ${roomId}`);
  }

  buildPlayer(
    userId: string,
    fullName: string,
    teamColor: TeamColor,
    socketId: string | null,
    existingPlayerCount: number,
    gameMode: GameMode,
  ): InternalPlayer {
    const color =
      gameMode === GameMode.SOLO ? GameStateService.soloColorAt(existingPlayerCount) : '';

    return { id: userId, fullName, teamColor, score: 0, color, socketId };
  }

  private endGame(roomId: string, callbacks: GameCallbacks): void {
    const state = this.games.get(roomId);
    if (!state) return;

    if (state.intervalHandle) {
      clearInterval(state.intervalHandle);
      state.intervalHandle = null;
    }

    state.status = GameStatus.FINISHED;
    this.logger.log(`Game ${roomId} finished — computing results`);

    callbacks.onGameOver(this.resultsService.calculate(state));
  }

  private requireGame(roomId: string): InternalGameState {
    const state = this.games.get(roomId);
    if (!state) throw new Error(`No active game for room ${roomId}`);
    return state;
  }

  private toWireState(state: InternalGameState): GameState {
    const wirePlayers: GameState['players'] = {};
    for (const [id, p] of Object.entries(state.players)) {
      wirePlayers[id] = {
        id: p.id,
        fullName: p.fullName,
        teamColor: p.teamColor,
        score: p.score,
        color: p.color,
      };
    }

    return {
      roomId: state.roomId,
      size: state.size,
      status: state.status,
      gameMode: state.gameMode,
      grid: state.grid,
      players: wirePlayers,
      remainingSeconds: state.remainingSeconds,
      startedAt: state.startedAt,
    };
  }
}
