import { IsString, Length } from 'class-validator';

export class ResetGameDto {
  @IsString()
  @Length(6, 6)
  roomCode!: string;
}
