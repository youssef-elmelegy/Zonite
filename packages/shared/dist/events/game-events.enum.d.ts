export declare const GameEvents: {
    readonly GAME_STARTED: "game_started";
    readonly BLOCK_CLAIMED: "block_claimed";
    readonly GAME_TICK: "game_tick";
    readonly GAME_OVER: "game_over";
    readonly CLAIM_BLOCK: "claim_block";
    readonly START_GAME: "start_game";
    readonly REQUEST_STATE: "request_state";
    readonly RESET_GAME: "reset_game";
    readonly EXCEPTION: "exception";
};
export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];
//# sourceMappingURL=game-events.enum.d.ts.map