import { create } from 'zustand';
import { GameStatus } from '../shared';
import type { Block, GameState, Player } from '../shared';

interface GameStore {
  grid: Block[][];
  players: Record<string, Player>;
  status: GameStatus;
  remainingSeconds: number;
  size: number;
  isDraw: boolean;
  roomCode: string;
  setGameState: (s: GameState) => void;
  applyBlockClaim: (block: Block) => void;
  tickTimer: (remaining: number) => void;
  setFinished: (isDraw?: boolean) => void;
  clearGame: () => void;
}

export const useGameStore = create<GameStore>()((set) => ({
  grid: [],
  players: {},
  status: GameStatus.LOBBY,
  remainingSeconds: 0,
  size: 0,
  isDraw: false,
  roomCode: '',
  setGameState: (s) =>
    set({
      grid: s.grid,
      players: s.players,
      status: s.status,
      remainingSeconds: s.remainingSeconds,
      size: s.size,
      isDraw: false,
      roomCode: s.roomCode,
    }),
  applyBlockClaim: (block) =>
    set((s) => {
      const newGrid = s.grid.map((row) => [...row]);
      const previous = newGrid[block.y]?.[block.x];
      const previousOwnerId = previous?.claimedBy ?? null;
      if (newGrid[block.y]?.[block.x]) {
        newGrid[block.y][block.x] = block;
      }
      const newPlayers = { ...s.players };
      // Decrement previous owner if this is an overwrite.
      if (previousOwnerId && previousOwnerId !== block.claimedBy && newPlayers[previousOwnerId]) {
        newPlayers[previousOwnerId] = {
          ...newPlayers[previousOwnerId],
          score: Math.max(0, newPlayers[previousOwnerId].score - 1),
        };
      }
      // Increment new owner.
      if (block.claimedBy && newPlayers[block.claimedBy]) {
        newPlayers[block.claimedBy] = {
          ...newPlayers[block.claimedBy],
          score: newPlayers[block.claimedBy].score + 1,
        };
      }
      return { grid: newGrid, players: newPlayers };
    }),
  tickTimer: (remaining) => set({ remainingSeconds: remaining }),
  setFinished: (isDraw) => set({ status: GameStatus.FINISHED, isDraw: isDraw ?? false }),
  clearGame: () =>
    set({
      grid: [],
      players: {},
      status: GameStatus.LOBBY,
      remainingSeconds: 0,
      size: 0,
      isDraw: false,
    }),
}));
