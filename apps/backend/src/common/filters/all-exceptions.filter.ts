import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ThrottlerException } from '@nestjs/throttler';
import { errorResponse } from '@/utils';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorKey: string | undefined = 'server_error';
    let data: Record<string, unknown> | undefined;

    if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      message = 'Too Many Requests';
      errorKey = 'rate_limited';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse() as string | Record<string, unknown>;
      if (typeof resp === 'string') {
        message = resp;
      } else {
        message = (resp.message as string) ?? exception.message;
        if (Array.isArray(resp.message)) {
          data = { fieldErrors: resp.message };
          errorKey = 'validation_failed';
        } else if (typeof resp.error === 'string') {
          errorKey = (resp.error as string).toLowerCase().replace(/\s+/g, '_');
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.stack);
      message = exception.message;
    }

    httpAdapter.reply(response, errorResponse(message, status, errorKey, data), status);
  }
}
