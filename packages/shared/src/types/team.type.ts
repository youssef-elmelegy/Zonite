import { TeamColor } from '../enums/team-color.enum';

export interface Team {
  /** RED or BLUE. NONE is a sentinel, never a real team. */
  color: TeamColor;
  score: number;
  playerIds: string[];
}
