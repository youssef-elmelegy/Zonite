import { IsDateString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA, MOCK_IMAGES } from '@/constants/examples';

export class SetupProfileDto {
  @ApiProperty({
    description: 'User date of birth (ISO 8601 date string)',
    example: MOCK_DATA.dates.dateOfBirth,
  })
  @IsDateString({}, { message: 'dateOfBirth must be a valid date (YYYY-MM-DD)' })
  dateOfBirth!: string;

  @ApiProperty({
    description: 'User profile image URL',
    example: MOCK_IMAGES.avatars.male,
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'profileImage must be a valid URL' })
  profileImage?: string;
}
