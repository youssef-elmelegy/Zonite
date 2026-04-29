import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameEvents, GameStatus, RoomEvents, TeamColor } from '../shared';
import type { GameState, Block, LobbyPlayer, RoomState, Results } from '../shared';
import { useGameStore } from '../store/game.store';
import { useRoomStore } from '../store/room.store';
import { useAuthStore } from '../store/auth.store';
import type { UseSocketReturn } from './useSocket';

export function useGameState(socket: UseSocketReturn) {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const resultsRef = useRef<Results | null>(null);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      socket.on(RoomEvents.ROOM_STATE, (payload: unknown) => {
        const state = payload as RoomState;
        // Play Again reset: game is FINISHED and server sends a fresh LOBBY state
        if (
          useGameStore.getState().status === GameStatus.FINISHED &&
          state.status === GameStatus.LOBBY
        ) {
          useGameStore.getState().clearGame();
          useRoomStore.getState().setPlayers(state.players);
          useRoomStore.getState().setRoom(state.roomCode, {
            gameMode: state.gameMode,
            gridSize: state.gridSize,
            durationSeconds: state.durationSeconds,
            maxPlayers: state.maxPlayers,
          });
          navigate('/lobby/' + state.roomCode);
          return;
        }
        useRoomStore.getState().setPlayers(state.players);
        useRoomStore.getState().setRoom(state.roomCode, {
          gameMode: state.gameMode,
          gridSize: state.gridSize,
          durationSeconds: state.durationSeconds,
          maxPlayers: state.maxPlayers,
        });
      }),
    );

    unsubs.push(
      socket.on(RoomEvents.PLAYER_JOINED, (payload: unknown) => {
        useRoomStore.getState().addOrUpdatePlayer(payload as LobbyPlayer);
      }),
    );

    unsubs.push(
      socket.on(RoomEvents.PLAYER_LEFT, (payload: unknown) => {
        useRoomStore.getState().removePlayer(payload as string);
      }),
    );

    unsubs.push(
      socket.on(GameEvents.GAME_STARTED, (payload: unknown) => {
        const state = payload as GameState;
        useGameStore.getState().setGameState(state);
        const userId = useAuthStore.getState().user?.id;
        const myTeam = userId
          ? (state.players[userId]?.teamColor ?? TeamColor.NONE)
          : TeamColor.NONE;
        useRoomStore.getState().setMyTeam(myTeam);
        useRoomStore.getState().setGameMode(state.gameMode);
        navigate(`/game/${code ?? state.roomId}`);
      }),
    );

    unsubs.push(
      socket.on(GameEvents.BLOCK_CLAIMED, (payload: unknown) => {
        useGameStore.getState().applyBlockClaim(payload as Block);
      }),
    );

    unsubs.push(
      socket.on(GameEvents.GAME_TICK, (payload: unknown) => {
        const tick = payload as { remaining: number };
        useGameStore.getState().tickTimer(tick.remaining);
      }),
    );

    unsubs.push(
      socket.on(GameEvents.GAME_OVER, (payload: unknown) => {
        const results = payload as Results;
        resultsRef.current = results;
        useGameStore.getState().setFinished(results.isDraw);
        navigate('/results');
      }),
    );

    unsubs.push(
      socket.on(GameEvents.EXCEPTION, (payload: unknown) => {
        const ex = payload as { message: string };
        console.error('[socket exception]', ex.message);
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, [socket, navigate, code]);

  return { results: resultsRef };
}
