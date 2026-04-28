import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiHeader } from '@nestjs/swagger';
import { ErrorResponseDto, LoginDto, AuthResponseWrapperDto } from '../dto';
import { AuthExamples } from '@/constants/examples/auth.examples';

export function AuthLoginDecorator() {
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
      summary: 'Login user',
      description:
        'Authenticates a user with email and password. Returns access token, refresh token, and user information. If profile setup is incomplete, returns a temporary token to complete profile setup.',
    }),
    ApiBody({
      type: LoginDto,
      description: 'User login credentials',
      examples: {
        success: {
          summary: 'Valid login request',
          value: AuthExamples.login.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User successfully logged in or profile setup required',
      type: AuthResponseWrapperDto,
      examples: {
        'Successful Login': {
          summary: AuthExamples.login.response.success.message,
          value: AuthExamples.login.response.success,
        },
        'Profile Setup Required': {
          summary: 'User needs to complete profile setup',
          value: AuthExamples.login.response.profileNotSetup,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid credentials (user not found or wrong password)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Email not verified or profile setup incomplete',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during authentication',
      type: ErrorResponseDto,
    }),
  );
}
