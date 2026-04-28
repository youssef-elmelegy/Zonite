import { IsDateString, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA, MOCK_IMAGES } from '@/constants';

export class UpdateProfileInfoDto {
  @ApiProperty({ example: MOCK_DATA.name.fullName, required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @ApiProperty({ example: MOCK_DATA.dates.dateOfBirth, required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ example: MOCK_IMAGES.avatars.male, required: false })
  @IsOptional()
  @IsUrl()
  profileImage?: string;
}
