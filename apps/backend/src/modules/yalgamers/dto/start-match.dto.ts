import { ApiProperty } from '@nestjs/swagger';

export class StartMatchDataDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Match started successfully' })
  message: string;
}

export class StartMatchResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Match started successfully' })
  message: string;

  @ApiProperty({ type: StartMatchDataDto })
  data: StartMatchDataDto;

  @ApiProperty({ example: '2026-04-27T12:00:00.000Z' })
  timestamp: string;
}
