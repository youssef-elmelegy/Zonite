import { IsString, Length } from 'class-validator';

export class StartGameDto {
  @IsString()
  @Length(6, 6)
  roomCode!: string;
}
