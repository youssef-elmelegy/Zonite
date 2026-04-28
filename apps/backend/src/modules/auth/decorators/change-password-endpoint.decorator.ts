import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ChangePasswordDto, ErrorResponseDto, ChangePasswordResponseWrapperDto } from '../dto';
import { AuthExamples } from '@/constants/examples/auth.examples';

export function AuthChangePasswordDecorator() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Change user password',
      description:
        'Allows authenticated users to update their password. ' +
        'The current password must be provided for verification. ' +
        'All existing sessions are terminated on success, requiring re-login on other devices.',
    }),
    ApiBody({
      type: ChangePasswordDto,
      description: 'Old and new password',
      examples: {
        default: {
          summary: 'Change password request',
          value: AuthExamples.changePassword.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Password changed successfully',
      type: ChangePasswordResponseWrapperDto,
      example: AuthExamples.changePassword.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Current password is incorrect',
      type: ErrorResponseDto,
      example: {
        code: 401,
        success: false,
        message: 'Current password is incorrect',
        error: 'UnauthorizedException',
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      type: ErrorResponseDto,
      example: AuthExamples.changePassword.response.notFound,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ErrorResponseDto,
      example: AuthExamples.changePassword.response.validationError,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error',
      type: ErrorResponseDto,
      example: AuthExamples.changePassword.response.internalServerError,
    }),
  );
}
