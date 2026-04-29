import { create } from 'zustand';
import { TeamColor, GameMode } from '../shared';
import type { LobbyPlayer } from '../shared';

interface RoomStore {
  roomCode: string | null;
  gameMode: GameMode | null;
  gridSize: number | null;
  durationSeconds: number | null;
  maxPlayers: number | null;
  players: LobbyPlayer[];
  myTeam: TeamColor;
  setRoom: (
    code: string,
    config: {
      gameMode: GameMode;
      gridSize: number;
      durationSeconds: number;
      maxPlayers: number;
    },
  ) => void;
  setPlayers: (players: LobbyPlayer[]) => void;
  addOrUpdatePlayer: (player: LobbyPlayer) => void;
  removePlayer: (id: string) => void;
  setMyTeam: (color: TeamColor) => void;
  setGameMode: (mode: GameMode) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomStore>()((set) => ({
  roomCode: null,
  gameMode: null,
  gridSize: null,
  durationSeconds: null,
  maxPlayers: null,
  players: [],
  myTeam: TeamColor.NONE,
  setRoom: (code, config) =>
    set({
      roomCode: code,
      gameMode: config.gameMode,
      gridSize: config.gridSize,
      durationSeconds: config.durationSeconds,
      maxPlayers: config.maxPlayers,
    }),
  setPlayers: (players) => set({ players }),
  addOrUpdatePlayer: (player) =>
    set((s) => {
      const exists = s.players.find((p) => p.id === player.id);
      if (exists) {
        return { players: s.players.map((p) => (p.id === player.id ? player : p)) };
      }
      return { players: [...s.players, player] };
    }),
  removePlayer: (id) => set((s) => ({ players: s.players.filter((p) => p.id !== id) })),
  setMyTeam: (color) => set({ myTeam: color }),
  setGameMode: (mode) => set({ gameMode: mode }),
  clearRoom: () =>
    set({
      roomCode: null,
      gameMode: null,
      gridSize: null,
      durationSeconds: null,
      maxPlayers: null,
      players: [],
      myTeam: TeamColor.NONE,
    }),
}));
