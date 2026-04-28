import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { GameMode } from '@zonite/shared';

export class UpdateRoomDto {
  @IsString()
  @Length(6, 6)
  roomCode!: string;

  @IsOptional()
  @IsEnum(GameMode)
  gameMode?: GameMode;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(50)
  gridSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(300)
  durationSeconds?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(10)
  maxPlayers?: number;

  @ValidateIf(
    (o: UpdateRoomDto) =>
      o.gameMode === undefined &&
      o.gridSize === undefined &&
      o.durationSeconds === undefined &&
      o.maxPlayers === undefined,
  )
  @IsString({ message: 'At least one field must be provided to update' })
  _atLeastOne?: never;
}
