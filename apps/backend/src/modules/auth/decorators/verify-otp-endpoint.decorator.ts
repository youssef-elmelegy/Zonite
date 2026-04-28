import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ErrorResponseDto, VerifyOtpDto, VerifyOtpResponseWrapperDto } from '../dto';
import { AuthExamples } from '@/constants/examples';

export function AuthVerifyOtpDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verify OTP',
      description: `Verifies the OTP sent to the user's email. Behaviour depends on the **purpose** field:

- **verify_email** — Checks that email is not already verified, marks it verified, and returns a setup-profile \`tempToken\` (valid for 10 minutes).
- **reset_password** — Skips the email-verified check, clears the OTP, and returns a reset-password \`tempToken\` (valid for 1 hour).

The response always includes \`tempTokenExpiresIn\` (seconds) alongside \`tempToken\`.`,
    }),
    ApiBody({
      type: VerifyOtpDto,
      description: 'OTP verification data including purpose',
      examples: {
        verifyEmail: {
          summary: 'Verify email',
          value: AuthExamples.verifyOtp.request.verifyEmail,
        },
        resetPassword: {
          summary: 'Reset password OTP',
          value: AuthExamples.verifyOtp.request.resetPassword,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'OTP verified — verify_email purpose',
      type: VerifyOtpResponseWrapperDto,
      example: AuthExamples.verifyOtp.response.success,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'OTP verified — reset_password purpose',
      type: VerifyOtpResponseWrapperDto,
      example: AuthExamples.verifyOtp.response.successResetPassword,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Email already verified (verify_email purpose only)',
      type: ErrorResponseDto,
      example: AuthExamples.verifyOtp.response.alreadyVerified,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or expired OTP',
      type: ErrorResponseDto,
      example: AuthExamples.verifyOtp.response.unauthorized,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      type: ErrorResponseDto,
      example: AuthExamples.verifyOtp.response.notFound,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ErrorResponseDto,
      example: AuthExamples.verifyOtp.response.validationError,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error',
      type: ErrorResponseDto,
      example: AuthExamples.verifyOtp.response.internalServerError,
    }),
  );
}
