import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/examples';
import { OtpPurpose } from './verify-otp.dto';

export class SendOtpDto {
  @ApiProperty({
    description: 'User email address to send OTP to',
    example: MOCK_DATA.email.user,
  })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Purpose of the OTP — determines which flow the OTP is for',
    enum: OtpPurpose,
    example: OtpPurpose.VERIFY_EMAIL,
  })
  @IsEnum(OtpPurpose, {
    message: `purpose must be one of: ${Object.values(OtpPurpose).join(', ')}`,
  })
  purpose: OtpPurpose;
}
