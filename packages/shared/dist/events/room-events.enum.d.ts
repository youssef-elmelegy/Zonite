export declare const RoomEvents: {
    readonly JOIN_ROOM: "join_room";
    readonly LEAVE_ROOM: "leave_room";
    readonly PLAYER_READY: "player_ready";
    readonly PLAYER_JOINED: "player_joined";
    readonly PLAYER_LEFT: "player_left";
    readonly ROOM_STATE: "room_state";
    readonly ROOM_UPDATED: "room_updated";
    readonly UPDATE_ROOM: "update_room";
};
export type RoomEventName = (typeof RoomEvents)[keyof typeof RoomEvents];
//# sourceMappingURL=room-events.enum.d.ts.map