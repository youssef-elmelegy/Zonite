import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GameMode } from '@zonite/shared';

export class CreateRoomDto {
  @ApiPropertyOptional({ enum: GameMode, default: GameMode.SOLO })
  @IsOptional()
  @IsEnum(GameMode)
  gameMode?: GameMode;

  @ApiPropertyOptional({
    minimum: 5,
    maximum: 50,
    default: 12,
    description: 'Square board edge length (N×N)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(50)
  gridSize?: number;

  @ApiPropertyOptional({
    enum: [30, 60, 90, 120],
    default: 60,
    description: 'Round duration in seconds',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(300)
  durationSeconds?: number;

  @ApiPropertyOptional({ minimum: 2, maximum: 10, default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(10)
  maxPlayers?: number;
}
