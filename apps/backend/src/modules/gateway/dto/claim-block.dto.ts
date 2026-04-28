import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ClaimBlockDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  x!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  y!: number;
}
