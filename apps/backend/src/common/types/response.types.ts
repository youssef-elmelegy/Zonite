export interface SuccessResponse<T> {
  code: number;
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ErrorResponse {
  code: number;
  success: false;
  message: string | string[];
  error?: string;
  data?: object;
  timestamp: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
