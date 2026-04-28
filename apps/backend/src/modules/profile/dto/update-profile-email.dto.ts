import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants';

export class UpdateProfileEmailDto {
  @ApiProperty({
    example: 'new.email@example.com',
    description: 'New email address — an OTP will be sent here for verification',
  })
  @IsEmail({}, { message: 'newEmail must be a valid email address' })
  newEmail: string;
}

export class UpdateProfileEmailResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Verification OTP sent to new email' })
  message: string;

  @ApiProperty({ example: { message: 'Verification OTP sent to new email' } })
  data: { message: string };

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}
