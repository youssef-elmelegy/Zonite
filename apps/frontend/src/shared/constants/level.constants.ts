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
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 100;

/** XP required to advance from level n to level n+1. Returns 0 once at MAX_LEVEL. */
export function xpForNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  const n = Math.max(MIN_LEVEL, level);
  return Math.floor((2000 * Math.log10(n + 1)) / 100) * 100;
}

/**
 * Convert a total XP amount into the player's current level + progress within the level.
 * Walks the curve from level 1 upward, subtracting per-level requirements. Caps at MAX_LEVEL.
 */
export function computeLevel(totalXp: number): {
  level: number;
  xpInLevel: number;
  xpForNext: number;
} {
  let level = MIN_LEVEL;
  let remaining = Math.max(0, Math.floor(totalXp));
  while (level < MAX_LEVEL) {
    const need = xpForNextLevel(level);
    if (remaining < need) {
      return { level, xpInLevel: remaining, xpForNext: need };
    }
    remaining -= need;
    level += 1;
  }
  return { level: MAX_LEVEL, xpInLevel: 0, xpForNext: 0 };
}

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

export const LEVEL_TIERS: LevelTier[] = [
  { name: 'Rookie', color: '#9CA3AF', min: 1, max: 10 },
  { name: 'Bronze', color: '#CD7F32', min: 11, max: 25 },
  { name: 'Silver', color: '#C0C8D8', min: 26, max: 50 },
  { name: 'Gold', color: '#F5C84B', min: 51, max: 80 },
  { name: 'Master', color: '#BC5AD7', min: 81, max: 100 },
];

export function tierForLevel(level: number): LevelTier {
  const clamped = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));
  for (const tier of LEVEL_TIERS) {
    if (clamped >= tier.min && clamped <= tier.max) return tier;
  }
  return LEVEL_TIERS[0]!;
}
