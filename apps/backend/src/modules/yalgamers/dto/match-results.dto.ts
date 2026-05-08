import { ApiProperty } from '@nestjs/swagger';

export const MATCH_STATUSES = ['pending', 'running', 'completed'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export class MatchWinnerDto {
  @ApiProperty({ example: 'team_A' })
  teamId: string;

  @ApiProperty({ example: 'Alpha Squad' })
  teamName: string;

  @ApiProperty({ example: ['player1', 'player2'], type: [String] })
  players: string[];
}

export class MatchPlayerResultDto {
  @ApiProperty({ example: 'player1' })
  userName: string;

  @ApiProperty({ example: 12, description: 'Blocks claimed by the player during the match' })
  points: number;
}

export class MatchTeamResultDto {
  @ApiProperty({ example: 'team_A' })
  teamId: string;

  @ApiProperty({ example: 'Alpha Squad' })
  teamName: string;

  @ApiProperty({
    example: 23,
    description: 'Sum of points across all players on the team (blocks claimed)',
  })
  totalPoints: number;

  @ApiProperty({ type: [MatchPlayerResultDto] })
  players: MatchPlayerResultDto[];
}

export class MatchResultsDataDto {
  @ApiProperty({ example: 'm_xyz789' })
  matchId: string;

  @ApiProperty({ example: 'running', enum: MATCH_STATUSES })
  status: MatchStatus;

  @ApiProperty({
    type: MatchWinnerDto,
    nullable: true,
    description: 'null when status is pending or running; team object when status is completed',
  })
  winner: MatchWinnerDto | null;

  @ApiProperty({
    type: [MatchTeamResultDto],
    description:
      'Per-team, per-player points. Empty array while status is pending or running; populated when status is completed.',
  })
  teams: MatchTeamResultDto[];
}

export class MatchResultsResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Match results fetched' })
  message: string;

  @ApiProperty({ type: MatchResultsDataDto })
  data: MatchResultsDataDto;

  @ApiProperty({ example: '2026-04-27T12:00:00.000Z' })
  timestamp: string;
}
