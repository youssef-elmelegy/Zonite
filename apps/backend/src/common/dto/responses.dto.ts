export type { SuccessResponse, ErrorResponse, ApiResponse } from '@/types';
import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { MOCK_DATA } from '@/constants/examples/global.constants';

/**
 * Generic Success Response DTO
 * Use this across all modules for consistent response formatting
 *
 * Example:
 * @ApiResponse({
 *   status: 200,
 *   type: SuccessResponseDto
 * })
 */
export class SuccessResponseDto<T> {
  @ApiProperty({
    example: HttpStatus.OK,
    description: 'HTTP status code',
    type: 'number',
  })
  code: HttpStatus;

  @ApiProperty({
    example: true,
    description: 'Response success status',
    type: 'boolean',
  })
  success: boolean;

  @ApiProperty({
    example: 'Operation successful',
    description: 'Response message',
    type: 'string',
  })
  message: string;

  @ApiProperty({
    description: 'Response data - can be any type',
    nullable: true,
  })
  data: T | null;

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'Response timestamp',
    type: 'string',
  })
  timestamp: string;

  constructor(
    code: HttpStatus,
    message: string,
    data: T | null = null,
    timestamp: string = new Date().toISOString(),
  ) {
    this.code = code;
    this.success = true;
    this.message = message;
    this.data = data;
    this.timestamp = timestamp;
  }
}

/**
 * Generic Error Response DTO
 * Use this for error responses across all modules
 */
export class ErrorResponseDto {
  @ApiProperty({
    example: HttpStatus.BAD_REQUEST,
    description: 'HTTP status code',
    type: 'number',
  })
  code: HttpStatus;

  @ApiProperty({
    example: false,
    description: 'Response success status',
    type: 'boolean',
  })
  success: boolean;

  @ApiProperty({
    example: ['email must be an email', 'password must be at least 8 characters'],
    description: 'Error message or validation error details',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({
    example: 'BadRequestException',
    description: 'Error type',
    type: 'string',
  })
  error: string;

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'Response timestamp',
    type: 'string',
  })
  timestamp: string;

  constructor(
    code: HttpStatus,
    message: string | string[],
    error: string,
    timestamp: string = new Date().toISOString(),
  ) {
    this.code = code;
    this.success = false;
    this.message = message;
    this.error = error;
    this.timestamp = timestamp;
  }
}
