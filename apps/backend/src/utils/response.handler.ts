import { HttpStatus } from '@nestjs/common';
import type { SuccessResponse, ErrorResponse } from '@/types';

export function successResponse<T>(
  data: T,
  message: string = 'Success',
  code: number = HttpStatus.OK,
): SuccessResponse<T> {
  return {
    code,
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(
  message: string = 'Internal Server Error',
  code: number = HttpStatus.INTERNAL_SERVER_ERROR,
  error?: string,
  data?: Record<string, unknown>,
): ErrorResponse {
  return {
    code,
    success: false,
    message,
    error: error || message.toLowerCase().replace(/\s+/g, '_'),
    data,
    timestamp: new Date().toISOString(),
  };
}
