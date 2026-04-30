import { ApiProperty } from '@nestjs/swagger';

export class CheckUserDataDto {
  @ApiProperty({
    example: true,
    description: "true if the username is found in the game's system, false if not",
  })
  exists: boolean;
}

export class CheckUserResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'User existence checked successfully' })
  message: string;

  @ApiProperty({ type: CheckUserDataDto })
  data: CheckUserDataDto;

  @ApiProperty({ example: '2026-04-27T12:00:00.000Z' })
  timestamp: string;
}
