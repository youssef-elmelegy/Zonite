import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/responses.dto';
import {
  UpdateProfileEmailDto,
  UpdateProfileEmailResponseDto,
} from '../dto/update-profile-email.dto';

export function ProfileUpdateEmailDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Update profile email',
      description:
        'Changes the account email address. Immediately sets isEmailVerified to false and sends a 6-digit OTP to the new address. Complete verification via POST /auth/verify-otp with purpose verify_email.',
    }),
    ApiBody({
      description: 'New email address',
      type: UpdateProfileEmailDto,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'OTP sent to new email',
      type: UpdateProfileEmailResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Email already in use by another account',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid access token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      description: 'Validation error',
      type: ErrorResponseDto,
    }),
  );
}
