import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { RoomEvents } from '@zonite/shared';

export interface UseSocketReturn {
  isConnected: boolean;
  emit: (event: string, ...args: unknown[]) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => () => void;
}

export function useSocket(roomCode: string): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(`${import.meta.env.VITE_SOCKET_URL as string}/game`, {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit(RoomEvents.JOIN_ROOM, { roomCode });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('reconnect', () => {
      setIsConnected(true);
      socket.emit('request_state', { roomCode });
    });

    return () => {
      socket.emit(RoomEvents.LEAVE_ROOM, { roomCode });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomCode]);

  const emit = useCallback((event: string, ...args: unknown[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  return { isConnected, emit, on };
}
