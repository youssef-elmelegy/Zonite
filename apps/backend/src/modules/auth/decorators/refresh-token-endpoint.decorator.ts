import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ErrorResponseDto, RefreshTokenResponseWrapperDto } from '../dto';

export function AuthRefreshTokenDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiHeader({
      name: 'X-Device-Info',
      description: 'JSON string describing the client device (optional)',
      required: false,
      schema: {
        type: 'string',
        default: '{"deviceType":"mobile","os":"Android","osVersion":"13","appVersion":"1.0.0"}',
      },
      examples: {
        androidPhone: {
          value:
            '{"deviceType":"mobile","os":"Android","osVersion":"13","appVersion":"1.0.0","brand":"Samsung","model":"Galaxy S23"}',
          description: 'Android smartphone',
        },
        web: {
          value:
            '{"deviceType":"web","os":"Windows","osVersion":"11","appVersion":"1.0.0","browser":"Chrome"}',
          description: 'Web browser',
        },
      },
    }),
    ApiOperation({
      summary: 'Refresh access token',
      description:
        'Uses a valid refresh token to obtain a new access token and refresh token pair. The refresh token is validated via JWT strategy.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Token successfully refreshed with new access and refresh tokens',
      type: RefreshTokenResponseWrapperDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (missing or invalid refresh token)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or expired refresh token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during token refresh',
      type: ErrorResponseDto,
    }),
  );
}
