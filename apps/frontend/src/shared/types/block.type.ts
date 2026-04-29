import { TeamColor } from '../enums/team-color.enum';

export interface Block {
  x: number;
  y: number;
  /** Player id that claimed this block, or null if unclaimed. */
  claimedBy: string | null;
  /** Team color of the claimer, or null if unclaimed. */
  teamColor: TeamColor | null;
  /** Epoch ms timestamp when this block becomes claimable again. 0 if no active cooldown. */
  cooldownUntil: number;
}
