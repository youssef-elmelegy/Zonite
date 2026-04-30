import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA, MOCK_IMAGES } from '@/constants';

export class GetProfileInfoDto {
  @ApiProperty({ example: MOCK_DATA.id.user, description: 'User UUID' })
  id: string;

  @ApiProperty({ example: MOCK_DATA.email.user })
  email: string;

  @ApiProperty({ example: MOCK_DATA.name.fullName })
  fullName: string;

  @ApiProperty({ example: MOCK_DATA.name.firstName })
  userName: string;

  @ApiProperty({ example: true })
  isEmailVerified: boolean;

  @ApiProperty({ example: MOCK_IMAGES.avatars.male, required: false })
  profileImage?: string;

  @ApiProperty({ example: 5 })
  xp: number;

  @ApiProperty({ example: 3 })
  level: number;

  @ApiProperty({ example: 10 })
  totalWins: number;

  @ApiProperty({ example: 50 })
  totalBlocksMined: number;

  @ApiProperty({ example: 20 })
  totalMatchesPlayed: number;

  @ApiProperty({ example: 4 })
  currentWinStreak: number;

  @ApiProperty({ example: '1990-01-01', type: String, format: 'date' })
  dateOfBirth: string;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  createdAt: string;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  updatedAt: string;
}

export class GetProfileInfoResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Profile retrieved successfully' })
  message: string;

  @ApiProperty({ type: GetProfileInfoDto })
  data: GetProfileInfoDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}
