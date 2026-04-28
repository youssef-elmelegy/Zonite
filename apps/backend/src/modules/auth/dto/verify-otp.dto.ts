import { IsString, Length, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/examples';

export enum OtpPurpose {
  VERIFY_EMAIL = 'verify_email',
  RESET_PASSWORD = 'reset_password',
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'User email address',
    example: MOCK_DATA.email.user,
  })
  @IsString()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    description: 'One-time password sent to email',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 characters' })
  otp: string;

  @ApiProperty({
    description: 'Purpose of the OTP verification',
    enum: OtpPurpose,
    example: OtpPurpose.VERIFY_EMAIL,
  })
  @IsEnum(OtpPurpose, {
    message: `purpose must be one of: ${Object.values(OtpPurpose).join(', ')}`,
  })
  purpose: OtpPurpose;
}
