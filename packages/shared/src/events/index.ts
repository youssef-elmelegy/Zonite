export * from './game-events.enum';
export * from './room-events.enum';
import type { GameEventName } from './game-events.enum';
import type { RoomEventName } from './room-events.enum';
export type SocketEventName = GameEventName | RoomEventName;
