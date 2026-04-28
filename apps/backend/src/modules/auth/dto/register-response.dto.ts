import { MOCK_DATA } from '@/constants';
import { ApiProperty } from '@nestjs/swagger';

export interface RegistrationResponse {
  message: string;
  email: string;
  otpSent: boolean;
}

export class RegistrationResponseDto implements RegistrationResponse {
  @ApiProperty({ example: 'User registered successfully. OTP sent to your email' })
  message!: string;

  @ApiProperty({ example: MOCK_DATA.email.user, format: 'email' })
  email!: string;

  @ApiProperty({ example: true })
  otpSent!: boolean;
}

export class RegistrationResponseWrapperDto {
  @ApiProperty({ example: 201 })
  code!: number;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Account created' })
  message!: string;

  @ApiProperty({ type: RegistrationResponseDto })
  data!: RegistrationResponseDto;

  @ApiProperty({ example: '2026-04-27T12:00:00.000Z' })
  timestamp!: string;
}
