import { HttpStatus } from '@nestjs/common';
import type { SuccessResponse, ErrorResponse } from '../types/response.types';

export function successResponse<T>(
  data: T,
  message = 'Success',
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
  message: string | string[],
  code: number = HttpStatus.INTERNAL_SERVER_ERROR,
  error?: string,
  data?: object,
): ErrorResponse {
  return {
    code,
    success: false,
    message,
    error,
    data,
    timestamp: new Date().toISOString(),
  };
}
