import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameMode, GameStatus } from '@zonite/shared';

export class RoomResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'ZX7K4P' })
  code!: string;

  @ApiProperty({ enum: GameStatus })
  status!: GameStatus;

  @ApiProperty({ format: 'uuid' })
  hostUserId!: string;

  @ApiProperty({ enum: GameMode })
  gameMode!: GameMode;

  @ApiProperty({ minimum: 5, maximum: 50, example: 12 })
  gridSize!: number;

  @ApiProperty({ minimum: 30, maximum: 300, example: 60 })
  durationSeconds!: number;

  @ApiProperty({ minimum: 2, maximum: 10, example: 6 })
  maxPlayers!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  startedAt!: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  endedAt!: string | null;
}
