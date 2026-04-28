import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ErrorResponseDto, SetupProfileDto, SetupProfileResponseWrapperDto } from '../dto';
import { AuthExamples } from '@/constants/examples/auth.examples';

export function AuthSetupProfileDecorator() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
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
      summary: 'Complete user profile setup',
      description:
        'Finalises the account after email verification. ' +
        'Requires the temporary token issued by `verify-otp`. ' +
        'Returns full JWT access/refresh tokens and the complete user object.',
    }),
    ApiBody({
      type: SetupProfileDto,
      description: 'Profile setup data',
      examples: {
        user: {
          summary: 'user profile setup',
          value: AuthExamples.setupProfile.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Profile setup completed successfully',
      type: SetupProfileResponseWrapperDto,
      example: AuthExamples.setupProfile.response.success,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Email not verified',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid access token',
      type: ErrorResponseDto,
      example: AuthExamples.setupProfile.response.unauthorized,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ErrorResponseDto,
      example: AuthExamples.setupProfile.response.validationError,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error',
      type: ErrorResponseDto,
      example: AuthExamples.setupProfile.response.internalServerError,
    }),
  );
}
