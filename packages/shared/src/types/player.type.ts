import { TeamColor } from '../enums/team-color.enum';

export interface Player {
  /** Stable user id (UUID). */
  id: string;
  displayName: string;
  /** NONE in solo mode. */
  teamColor: TeamColor;
  score: number;
}
