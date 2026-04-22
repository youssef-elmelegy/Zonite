export type SuccessResponse<T> = {
  code: number;
  success: true;
  message: string;
  data: T;
  timestamp: string;
};

export type ErrorResponse = {
  code: number;
  success: false;
  message: string;
  error?: string;
  data?: Record<string, unknown>;
  timestamp: string;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
