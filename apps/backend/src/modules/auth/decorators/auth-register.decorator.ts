import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto';
import { AuthExamples } from '@/constants/examples';
import { RegisterDto } from '../dto/register.dto';
import { RegistrationResponseWrapperDto } from '../dto/register-response.dto';

export function AuthRegisterDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register a new user and send OTP',
      description:
        'Creates a new user account and sends an OTP to their email for verification. ' +
        'Password must be at least 8 characters. The response includes an `otpSent` flag ' +
        'indicating whether the verification email was dispatched successfully.',
    }),
    ApiBody({
      type: RegisterDto,
      description: 'User registration data',
      examples: {
        success: {
          summary: 'Valid registration request',
          value: AuthExamples.register.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'User registered successfully, OTP sent to email',
      type: RegistrationResponseWrapperDto,
      example: AuthExamples.register.response.success,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Email already registered',
      type: ErrorResponseDto,
      example: AuthExamples.register.response.conflict,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ErrorResponseDto,
      example: AuthExamples.register.response.validationError,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error',
      type: ErrorResponseDto,
      example: AuthExamples.register.response.internalServerError,
    }),
  );
}
