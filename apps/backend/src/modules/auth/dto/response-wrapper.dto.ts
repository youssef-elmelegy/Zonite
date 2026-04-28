import { MOCK_DATA, MOCK_IMAGES } from '@/constants';
import { ApiProperty } from '@nestjs/swagger';

export class UserDataDto {
  @ApiProperty({
    example: MOCK_DATA.id.user,
    description: 'Unique user identifier (UUID)',
  })
  id: string;

  @ApiProperty({
    example: MOCK_DATA.email.user,
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: MOCK_DATA.name.fullName,
    description: 'User full name',
  })
  fullName: string;

  @ApiProperty({
    example: MOCK_IMAGES.avatars.male,
    description: 'User profile image URL',
    required: false,
  })
  profileImage?: string | null;

  @ApiProperty({
    example: MOCK_DATA.dates.dateOfBirth,
    description: 'User date of birth',
    required: false,
  })
  dateOfBirth?: string | null;

  @ApiProperty({
    example: true,
    description: 'Whether email is verified',
  })
  isEmailVerified: boolean;

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'User creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'User last update timestamp',
  })
  updatedAt: Date;
}

export class VerifyOtpResponseDto {
  @ApiProperty({
    example: 'Email verified successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'Temporary JWT token — use as Bearer token for the next step (setup-profile for verify_email, reset-password for reset_password)',
  })
  tempToken: string;

  @ApiProperty({
    example: 600,
    description: 'Seconds until the temporary token expires',
  })
  tempTokenExpiresIn: number;

  @ApiProperty({
    type: UserDataDto,
    description: 'User information after verification',
  })
  user: UserDataDto;
}

export class VerifyOtpResponseWrapperDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Email verified successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: VerifyOtpResponseDto,
    description:
      'Response data containing verification message, tempToken, tempTokenExpiresIn, and user info',
  })
  data: VerifyOtpResponseDto;

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class SetupProfileResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  refreshToken: string;

  @ApiProperty({
    type: UserDataDto,
    description: 'Complete user information after profile setup',
  })
  user: UserDataDto;
}

export class SetupProfileResponseWrapperDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Profile setup completed',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: SetupProfileResponseDto,
    description: 'Response data containing tokens and user information',
  })
  data: SetupProfileResponseDto;

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class SendOtpResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether the OTP email was successfully dispatched',
  })
  otpSent: boolean;
}

export class SendOtpResponseWrapperDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'OTP sent successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: SendOtpResponseDto,
    description: 'Response data containing the otpSent flag',
  })
  data: SendOtpResponseDto;

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class AuthResponseWrapperDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'User logged in successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: UserDataDto,
    description: 'Response data containing tokens and user information',
  })
  data: UserDataDto;

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class RefreshTokenResponseWrapperDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Tokens refreshed successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: Object,
    description: 'Response data containing new tokens',
  })
  data: { refreshed: true };

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    example: 'Password reset successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    example: true,
    description: 'Whether the password was successfully reset',
  })
  reset: boolean;
}

export class ResetPasswordResponseWrapperDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Password reset successfully' })
  message: string;

  @ApiProperty({ type: ResetPasswordResponseDto })
  data: ResetPasswordResponseDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty({
    example: 'Password changed successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    example: true,
    description: 'Whether the password was successfully changed',
  })
  changed: boolean;
}

export class ChangePasswordResponseWrapperDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Password changed successfully' })
  message: string;

  @ApiProperty({ type: ChangePasswordResponseDto })
  data: ChangePasswordResponseDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    example: 'Logout successful',
    description: 'Logout confirmation message',
  })
  message: string;

  @ApiProperty({
    example: true,
    description: 'Whether the logout was processed successfully',
  })
  loggedOut: boolean;
}

export class LogoutResponseWrapperDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Logout successful',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: LogoutResponseDto,
    description: 'Response data containing logout message',
  })
  data: LogoutResponseDto;

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'Response timestamp',
  })
  timestamp: string;
}
