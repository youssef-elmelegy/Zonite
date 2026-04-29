/**
 * Level system.
 *
 * Each level n→n+1 requires its own XP amount given by:
 *   xpForNextLevel(n) = floor(2000 * log10(n + 1) / 100) * 100
 *
 * Examples (per-level XP requirement):
 *   1→2:   600
 *   2→3:   900
 *   10→11: 2000
 *   50→51: 3400
 *   99→100: 4000
 *
 * Total cumulative XP from level 1 to MAX_LEVEL ≈ 311,000.
 */
export declare const MIN_LEVEL = 1;
export declare const MAX_LEVEL = 100;
/** XP required to advance from level n to level n+1. Returns 0 once at MAX_LEVEL. */
export declare function xpForNextLevel(level: number): number;
/**
 * Convert a total XP amount into the player's current level + progress within the level.
 * Walks the curve from level 1 upward, subtracting per-level requirements. Caps at MAX_LEVEL.
 */
export declare function computeLevel(totalXp: number): {
    level: number;
    xpInLevel: number;
    xpForNext: number;
};
/**
 * Visual tier for a level. Boundaries are inclusive on both ends.
 * Hex colors are reserved (not used elsewhere in-game) so tiers read as their own thing.
 */
export interface LevelTier {
    name: string;
    color: string;
    min: number;
    max: number;
}
export declare const LEVEL_TIERS: LevelTier[];
export declare function tierForLevel(level: number): LevelTier;
//# sourceMappingURL=level.constants.d.ts.map