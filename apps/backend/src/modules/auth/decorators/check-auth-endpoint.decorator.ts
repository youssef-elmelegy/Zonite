import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto';
import { AuthExamples } from '@/constants/examples';

export function AuthCheckAuthDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Check authentication status',
      description:
        'Verifies if the user is authenticated by validating the JWT token. ' +
        'Returns the authenticated user details if valid, or an unauthorized error otherwise.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User is authenticated',
      example: AuthExamples.checkAuth.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or expired token',
      type: ErrorResponseDto,
      example: AuthExamples.checkAuth.response.unauthorized,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      type: ErrorResponseDto,
      example: AuthExamples.checkAuth.response.notFound,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error',
      type: ErrorResponseDto,
      example: AuthExamples.checkAuth.response.internalServerError,
    }),
  );
}
