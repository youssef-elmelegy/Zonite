import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ErrorResponseDto, SendOtpDto, SendOtpResponseWrapperDto } from '../dto';
import { AuthExamples } from '@/constants/examples';

export function AuthSendOtpDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Send OTP to email',
      description: `Sends (or re-sends) a one-time password to the user's email. Behaviour depends on the **purpose** field:

- **verify_email** — Only allowed when email is not yet verified. Sends the email-verification OTP.
- **reset_password** — Allowed regardless of verification status. Sends the password-reset OTP.

A 60-second cooldown is enforced per email address across all purposes.`,
    }),
    ApiBody({
      type: SendOtpDto,
      description: 'Email address and OTP purpose',
      examples: {
        verifyEmail: {
          summary: 'Send verification OTP',
          value: AuthExamples.sendOtp.request.verifyEmail,
        },
        resetPassword: {
          summary: 'Send reset-password OTP',
          value: AuthExamples.sendOtp.request.resetPassword,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'OTP sent successfully',
      type: SendOtpResponseWrapperDto,
      example: AuthExamples.sendOtp.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      type: ErrorResponseDto,
      example: AuthExamples.sendOtp.response.notFound,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Email already verified (verify_email purpose only)',
      type: ErrorResponseDto,
      example: AuthExamples.sendOtp.response.alreadyVerified,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error or too many OTP send attempts',
      type: ErrorResponseDto,
      examples: {
        validationError: {
          summary: 'Validation error',
          value: AuthExamples.sendOtp.response.validationError,
        },
        tooManyAttempts: {
          summary: 'Too many attempts',
          value: AuthExamples.sendOtp.response.tooManyAttempts,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error',
      type: ErrorResponseDto,
      example: AuthExamples.sendOtp.response.internalServerError,
    }),
  );
}
