import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ResetPasswordDto, ErrorResponseDto, ResetPasswordResponseWrapperDto } from '../dto';
import { AuthExamples } from '@/constants/examples/auth.examples';

export function AuthResetPasswordDecorator() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Reset password using temp token',
      description:
        "Resets the user's password using the temporary token returned by `verify-otp` with `purpose=reset_password`. " +
        'Pass that token as a Bearer token in the Authorization header. Only tokens of type `reset-password` are accepted.',
    }),
    ApiBody({
      type: ResetPasswordDto,
      description: 'New password',
      examples: {
        default: {
          summary: 'Reset password request',
          value: AuthExamples.resetPassword.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Password reset successfully',
      type: ResetPasswordResponseWrapperDto,
      example: AuthExamples.resetPassword.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing, invalid, or wrong-type token',
      type: ErrorResponseDto,
      example: AuthExamples.resetPassword.response.invalidToken,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ErrorResponseDto,
      example: AuthExamples.resetPassword.response.validationError,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error',
      type: ErrorResponseDto,
      example: AuthExamples.resetPassword.response.internalServerError,
    }),
  );
}
