import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto, LogoutResponseWrapperDto } from '../dto';
import { AuthExamples } from '@/constants/examples';

export function AuthLogoutDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Logout user',
      description: 'Logs out the authenticated user.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Logout successful',
      type: LogoutResponseWrapperDto,
      examples: {
        success: {
          summary: 'Logout current session',
          value: AuthExamples.logout.response.success,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or missing access token',
      type: ErrorResponseDto,
      example: AuthExamples.logout.response.unauthorized,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error',
      type: ErrorResponseDto,
      example: AuthExamples.logout.response.internalServerError,
    }),
  );
}
